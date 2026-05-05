const Bill = require('../models/Bill');
const sendResponse = require('../utils/responseFormatter');

// @desc    Get all bills for logged in user
// @route   GET /api/bills
// @access  Private
exports.getBills = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100; // default large limit
        const skip = (page - 1) * limit;

        // Build query
        const reqQuery = { ...req.query };
        const removeFields = ['page', 'limit', 'sort'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Add user to query
        reqQuery.userId = req.user.id;

        let query = Bill.find(reqQuery);

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('dueDate');
        }

        query = query.skip(skip).limit(limit);

        const bills = await query;
        const total = await Bill.countDocuments(reqQuery);

        res.status(200).json({
            success: true,
            count: bills.length,
            total,
            pagination: { page, limit },
            data: bills
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add new bill
// @route   POST /api/bills
// @access  Private
exports.addBill = async (req, res, next) => {
    try {
        req.body.userId = req.user.id;
        const bill = await Bill.create(req.body);

        // Immediate Notification parsing
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0,0,0,0);

        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff <= 3) {
            const isOverdue = daysDiff < 0;
            const Notification = require('../models/Notification');
            const sendEmail = require('../utils/emailService');
            
            let msg = '';
            if (isOverdue) msg = `URGENT: ${bill.billName} is overdue!`;
            else if (daysDiff === 0) msg = `Reminder: ${bill.billName} is due today.`;
            else msg = `Reminder: ${bill.billName} is due in ${daysDiff} days.`;

            await Notification.create({
                userId: bill.userId,
                billId: bill._id,
                message: msg,
                type: isOverdue ? 'overdue' : 'upcoming'
            });

            // Instant Email Hook
            try {
                const emailHtml = `
                    <h2>Bill Payment Reminder</h2>
                    <p>Hi ${req.user.name},</p>
                    <p>Your bill <strong>${bill.billName}</strong> for <strong>₹${bill.amount}</strong> is ${isOverdue ? 'overdue' : `due on ${bill.dueDate.toISOString().split('T')[0]}`}.</p>
                    <p><a href="${bill.paymentLink}" style="padding:10px 15px; background:blue; color:white; text-decoration:none; border-radius:5px;">Pay Now</a></p>
                `;
                await sendEmail({ email: req.user.email, subject: `Reminder: ${bill.billName}`, message: emailHtml });
            } catch (emailErr) {
                console.error("Failed to send immediate email reminder", emailErr);
            }
        } // ADDED MISSING BRACKET HERE

        // General Confirmation Email
        try {
            const sendEmail = require('../utils/emailService');
            const confirmHtml = `
                <h2>Bill Saved Successfully</h2>
                <p>Hi ${req.user.name},</p>
                <p>We've successfully saved your bill <strong>${bill.billName}</strong> for <strong>₹${bill.amount}</strong> due on ${bill.dueDate.toISOString().split('T')[0]}.</p>
                <p>We'll remind you when it's due!</p>
            `;
            await sendEmail({ email: req.user.email, subject: `Bill Saved: ${bill.billName}`, message: confirmHtml });
        } catch (emailErr) {
            console.error("Failed to send bill confirmation email", emailErr);
        }

        sendResponse(res, 201, true, 'Bill created successfully', bill);
    } catch (err) {
        next(err);
    }
};

// @desc    Update bill
// @route   PUT /api/bills/:id
// @access  Private
exports.updateBill = async (req, res, next) => {
    try {
        let bill = await Bill.findById(req.params.id);

        if (!bill) {
            return sendResponse(res, 404, false, 'Bill not found');
        }

        // Make sure user owns bill
        if (bill.userId.toString() !== req.user.id) {
            return sendResponse(res, 401, false, 'Not authorized to update this bill');
        }

        // If marked as paid, timestamp it
        if (req.body.status === 'paid' && bill.status !== 'paid') {
            req.body.paidAt = Date.now();
        }

        bill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true
        });

        sendResponse(res, 200, true, 'Bill updated successfully', bill);
    } catch (err) {
        next(err);
    }
};

// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private
exports.deleteBill = async (req, res, next) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return sendResponse(res, 404, false, 'Bill not found');
        }

        if (bill.userId.toString() !== req.user.id) {
            return sendResponse(res, 401, false, 'Not authorized to delete this bill');
        }

        await bill.deleteOne();

        sendResponse(res, 200, true, 'Bill deleted successfully');
    } catch (err) {
        next(err);
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/bills/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
    try {
        const bills = await Bill.find({ userId: req.user.id });

        const totalPending = bills.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + b.amount, 0);
        const totalPaid = bills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0);
        const upcomingCount = bills.filter(b => b.status === 'pending' && new Date(b.dueDate) >= new Date()).length;
        const overdueCount = bills.filter(b => b.status === 'overdue').length;

        // Category breakdown
        const categoryMap = {};
        bills.forEach(b => {
            if(!categoryMap[b.category]) categoryMap[b.category] = 0;
            categoryMap[b.category] += b.amount;
        });

        const categoryBreakdown = Object.keys(categoryMap).map(k => ({
            category: k,
            total: categoryMap[k]
        }));

        sendResponse(res, 200, true, 'Analytics fetched', {
            totalPending,
            totalPaid,
            upcomingCount,
            overdueCount,
            categoryBreakdown
        });
    } catch (err) {
        next(err);
    }
};
