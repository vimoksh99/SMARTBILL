const Notification = require('../models/Notification');
const sendResponse = require('../utils/responseFormatter');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort('-createdAt');
        sendResponse(res, 200, true, 'Notifications fetched', notifications);
    } catch (err) {
        next(err);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notif = await Notification.findById(req.params.id);
        if (!notif || notif.userId.toString() !== req.user.id) {
            return sendResponse(res, 404, false, 'Notification not found');
        }
        notif.read = true;
        await notif.save();
        sendResponse(res, 200, true, 'Notification marked as read');
    } catch (err) {
        next(err);
    }
};
