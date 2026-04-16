const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    supportEmail: {
        type: String,
        required: true,
        default: 'admin@billyament.com'
    },
    supportPhone: {
        type: String,
        required: true,
        default: '+91 98765 43210'
    },
    supportAddress: {
        type: String,
        required: true,
        default: 'SmartBill Headquarters, Global'
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
