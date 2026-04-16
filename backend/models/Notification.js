const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    billId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bill'
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['overdue', 'upcoming', 'info', 'success'],
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
