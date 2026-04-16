const cron = require('node-cron');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/emailService');
const sendSMS = require('../utils/smsService');

// Execute every day at 00:00 midnight
const startReminderJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily reminder jobs...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const bills = await Bill.find({ status: { $ne: 'paid' } }).populate('userId');

            for (let bill of bills) {
                const dueDate = new Date(bill.dueDate);
                dueDate.setHours(0,0,0,0);

                const timeDiff = dueDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                let shouldRemind = false;
                let isOverdue = false;

                // Overdue logic
                if (daysDiff < 0) {
                    if (bill.status !== 'overdue') {
                        bill.status = 'overdue';
                        await bill.save();
                    }
                    isOverdue = true;
                    shouldRemind = true; // Remind daily if overdue
                }

                // Custom reminders
                if (bill.reminderTimes && bill.reminderTimes.length > 0) {
                    bill.reminderTimes.forEach(rt => {
                        const remDate = new Date(rt);
                        remDate.setHours(0,0,0,0);
                        if (remDate.getTime() === today.getTime()) shouldRemind = true;
                    });
                } else if (!isOverdue) {
                    // Default reminders: 3 days, 1 day, 0 days
                    if (daysDiff === 3 || daysDiff === 1 || daysDiff === 0) {
                        shouldRemind = true;
                    }
                }

                if (shouldRemind) {
                    const user = bill.userId; // populated
                    if (!user) continue;

                    // In-App Notification
                    await Notification.create({
                        userId: user._id,
                        billId: bill._id,
                        message: isOverdue ? `URGENT: ${bill.billName} is overdue!` : `Reminder: ${bill.billName} is due ${daysDiff === 0 ? 'today' : 'in ' + daysDiff + ' days'}.`,
                        type: isOverdue ? 'overdue' : 'upcoming'
                    });

                    // Email Hook
                    const emailHtml = `
                        <h2>Bill Payment Reminder</h2>
                        <p>Hi ${user.name},</p>
                        <p>Your bill <strong>${bill.billName}</strong> for <strong>₹${bill.amount}</strong> is ${isOverdue ? 'overdue' : 'due on ' + bill.dueDate.toISOString().split('T')[0]}.</p>
                        <p><a href="${bill.paymentLink}" style="padding:10px 15px; background:blue; color:white; text-decoration:none; border-radius:5px;">Pay Now</a></p>
                    `;
                    await sendEmail({ email: user.email, subject: `Reminder: ${bill.billName}`, message: emailHtml });

                    // SMS Hook (mocked unless phone exists on schema - but here we simulate)
                    // Assuming user phone doesn't exist, we just mock the payload.
                    await sendSMS({ phone: 'user_phone_placeholder', message: `Reminder: ${bill.billName} is ${isOverdue ? 'overdue' : 'upcoming'}. Pay at: ${bill.paymentLink}` });
                }
            }
        } catch (error) {
            console.error('Error in cron job', error);
        }
    });
};

module.exports = { startReminderJobs };
