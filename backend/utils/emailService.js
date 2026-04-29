const axios = require('axios');
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

    if (!process.env.BREVO_API_KEY) {
        console.log(`[MOCK EMAIL] To: ${options.email}, Subject: ${options.subject}`);
        console.log(`[MOCK EMAIL BODY]\n${options.message}`);
        return;
    }

    try {
        const payload = {
            sender: {
                name: process.env.FROM_NAME || "SmartBill Support",
                email: process.env.EMAIL_USER || "smartbilllpu@gmail.com"
            },
            to: [{ email: options.email }],
            subject: options.subject,
            htmlContent: options.message
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });
        
        console.log('Email sent successfully via Brevo API:', response.data);
    } catch (err) {
        console.error('Brevo API Error:', err.response ? err.response.data : err.message);
        throw err;
    }
};

module.exports = sendEmail;
