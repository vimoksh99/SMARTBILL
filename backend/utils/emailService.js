const nodemailer = require('nodemailer');
const User = require('../models/User');

const sendEmail = async (options) => {
    try {
        const user = await User.findOne({ email: options.email });
        if (user && user.role === 'admin') {
            console.log(`[EMAIL BLOCKED] Admin account ${options.email} bypassed email sending.`);
            return;
        }
    } catch (err) {
        console.error('Error checking admin for email:', err);
    }

    // If no credentials, just mock the console output
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[MOCK EMAIL] To: ${options.email}, Subject: ${options.subject}`);
        console.log(`[MOCK EMAIL BODY]\n${options.message}`);
        return;
    }

    const cleanPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/^["']|["']$/g, '') : null;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // false for port 587
        family: 4, // Force IPv4
        auth: {
            user: process.env.EMAIL_USER,
            pass: cleanPass,
        },
    });

    const fromName = process.env.FROM_NAME || 'SmartBill Support';
    
    const message = {
        from: `${fromName} <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
