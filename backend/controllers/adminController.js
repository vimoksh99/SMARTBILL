const User = require('../models/User');
const Complaint = require('../models/Complaint');
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
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return sendResponse(res, 404, false, 'Complaint not found');
        }

        complaint.status = req.body.status || 'Resolved';
        if (req.body.reply) {
            complaint.adminReply = req.body.reply;
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
