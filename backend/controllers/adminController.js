const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/responseFormatter');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        sendResponse(res, 200, true, 'Users fetched successfully', users);
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle block status of user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.toggleBlockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        if (user.role === 'admin') {
            return sendResponse(res, 400, false, 'Cannot block admin');
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        sendResponse(res, 200, true, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, user);
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user and cascading data
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        if (user.role === 'admin') {
            return sendResponse(res, 400, false, 'Cannot delete admin');
        }

        const Bill = require('../models/Bill');
        const Notification = require('../models/Notification');

        await Bill.deleteMany({ userId: user._id });
        await Notification.deleteMany({ userId: user._id });
        await Complaint.deleteMany({ user: user._id });
        
        await user.deleteOne();

        sendResponse(res, 200, true, 'User and all associated data deleted successfully');
    } catch (err) {
        next(err);
    }
};

// @desc    Get all complaints
// @route   GET /api/admin/complaints
// @access  Private/Admin
exports.getComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.find().populate('user', 'name email').sort({ createdAt: -1 });
        sendResponse(res, 200, true, 'Complaints fetched successfully', complaints);
    } catch (err) {
        next(err);
    }
};

// @desc    Update complaint status
// @route   PUT /api/admin/complaints/:id
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id).populate('user', 'name email');
        if (!complaint) {
            return sendResponse(res, 404, false, 'Complaint not found');
        }

        complaint.status = req.body.status || 'Resolved';
        if (req.body.reply) {
            complaint.adminReply = req.body.reply;
            
            // Send email notification to the user about their resolved complaint
            if (complaint.user && complaint.user.email) {
                const sendEmail = require('../utils/emailService');
                const message = `
                    <h2>Support Ticket Update</h2>
                    <p>Dear ${complaint.user.name},</p>
                    <p>The admin has responded to your support ticket regarding: <strong>${complaint.subject}</strong></p>
                    <div style="padding: 15px; border-left: 4px solid #8b5cf6; background: #f3f4f6; margin: 15px 0;">
                        <p style="margin: 0; color: #4b5563;"><strong>Admin Reply:</strong></p>
                        <p style="margin: 5px 0 0 0; color: #111827;">${req.body.reply}</p>
                    </div>
                    <p>Best Regards,</p>
                    <p>SmartBill Support Team</p>
                `;
                
                try {
                    await sendEmail({
                        email: complaint.user.email,
                        subject: 'Re: ' + complaint.subject,
                        message
                    });
                    
                    // Also fire an in-app notification for the bell
                    await Notification.create({
                        userId: complaint.user._id,
                        message: `Admin resolved your ticket: ${complaint.subject}. See email for details.`,
                        type: 'info'
                    });
                } catch(emailErr) {
                    console.log('Failed to send complaint reply email or notification', emailErr);
                }
            }
        }
        await complaint.save();

        sendResponse(res, 200, true, 'Complaint status updated', complaint);
    } catch (err) {
        next(err);
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });

        sendResponse(res, 200, true, 'Stats fetched', {
            totalUsers,
            pendingComplaints
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Manually seed admin accounts
// @route   GET /api/admin/seed-manual
// @access  Public (Hidden)
exports.manualSeedAdmin = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const defaultAdmins = [
            { name: 'System Admin 1', email: 'admin1@smartbill.com' },
            { name: 'System Admin 2', email: 'admin2@smartbill.com' },
            { name: 'System Admin 3', email: 'admin3@smartbill.com' }
        ];

        let seeded = [];
        for (let adminData of defaultAdmins) {
            const existingAdmin = await User.findOne({ email: adminData.email });
            if (!existingAdmin) {
                await User.create({
                    name: adminData.name,
                    email: adminData.email,
                    password: 'Smartbill@lpu.in',
                    role: 'admin',
                    isVerified: true
                });
                seeded.push(adminData.email);
            } else if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                existingAdmin.password = 'Smartbill@lpu.in';
                existingAdmin.isVerified = true;
                await existingAdmin.save();
                seeded.push(adminData.email + ' (Updated)');
            }
        }
        res.status(200).json({ success: true, message: 'Admin seeding complete.', seeded });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to seed admins', error: err.message });
    }
};
