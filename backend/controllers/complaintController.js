const Complaint = require('../models/Complaint');
const sendResponse = require('../utils/responseFormatter');

// @desc    Submit a new complaint/message
// @route   POST /api/complaints
// @access  Private
exports.submitComplaint = async (req, res, next) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return sendResponse(res, 400, false, 'Please add subject and message');
        }

        const crypto = require('crypto');
        const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
        const ticketId = `SB-${randomString}`;

        const complaint = await Complaint.create({
            ticketId,
            user: req.user.id,
            subject,
            message
        });

        sendResponse(res, 201, true, `Message submitted successfully. Your Ticket ID is ${ticketId}.`, complaint);
    } catch (err) {
        next(err);
    }
};

// @desc    Get logged in user complaints
// @route   GET /api/complaints/my
// @access  Private
exports.getMyComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
        sendResponse(res, 200, true, 'Complaints fetched successfully', complaints);
    } catch (err) {
        next(err);
    }
};
