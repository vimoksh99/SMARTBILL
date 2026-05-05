const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            pool: true,
            maxConnections: 1,
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });
    }
    return transporter;
};

const sendEmail = async (options) => {
    try {
        const mailer = getTransporter();

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'SmartBill Support'}" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.message,
            text: options.message.replace(/<[^>]*>?/gm, ''), // Plain text fallback
        };

        const info = await mailer.sendMail(mailOptions);
        console.log('Email sent successfully via Nodemailer:', info.response);
    } catch (err) {
        console.error('Nodemailer API Error:', err);
        throw err;
    }
};

module.exports = sendEmail;
