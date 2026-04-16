const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // If no credentials, just mock the console output
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[MOCK EMAIL] To: ${options.email}, Subject: ${options.subject}`);
        console.log(`[MOCK EMAIL BODY]\n${options.message}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
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
