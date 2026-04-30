const nodemailer = require('nodemailer');
const dns = require('dns');
const User = require('../models/User');

const resolveIPv4 = (domain) => {
    return new Promise((resolve, reject) => {
        dns.resolve4(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses[0]);
        });
    });
};

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

    try {
        const smtpHost = await resolveIPv4('smtp.gmail.com');
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                servername: "smtp.gmail.com" // ✅ VERY IMPORTANT (SSL validation)
            }
        });

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'SmartBill Support'}" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.message,
            text: options.message.replace(/<[^>]*>?/gm, ''), // Plain text fallback
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Nodemailer:', info.response);
    } catch (err) {
        console.error('Nodemailer API Error:', err);
        throw err;
    }
};

module.exports = sendEmail;
