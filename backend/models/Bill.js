const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    billName: {
        type: String,
        required: [true, 'Please add a bill name'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount']
    },
    dueDate: {
        type: Date,
        required: [true, 'Please add a due date'],
        index: true
    },
    reminderType: {
        type: String,
        enum: ['one-time', 'recurring'],
        default: 'one-time'
    },
    reminderTimes: {
        type: [Date], // Extracted specific custom array of dates chosen by user to remind
        default: []
    },
    providerName: {
        type: String,
        default: 'Unknown'
    },
    category: {
        type: String,
        enum: ['Electricity', 'Rent', 'Subscription', 'Loan', 'Other'],
        default: 'Other'
    },
    paymentLink: {
        type: String,
        required: [true, 'Please provide a payment link']
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },
    paidAt: {
        type: Date
    },
    transactionId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Bill', BillSchema);
