const axios = require('axios');
const User = require('../models/User');

const sendSMS = async (options) => {
    try {
        const user = await User.findOne({ phone: options.phone });
        if (user && user.role === 'admin') {
            console.log(`[SMS BLOCKED] Admin account ${options.phone} bypassed SMS sending.`);
            return;
        }
    } catch (err) {
        console.error('Error checking admin for SMS:', err);
    }

    if (!process.env.FAST2SMS_KEY || !options.phone) {
        console.log(`[MOCK SMS] To: ${options.phone}, Message: ${options.message}`);
        return;
    }

    try {
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: process.env.FAST2SMS_KEY,
                route: 'q',
                message: options.message,
                language: 'english',
                flash: 0,
                numbers: options.phone
            }
        });
        console.log('SMS sent successfully', response.data);
    } catch (error) {
        console.error('Fast2SMS Error API:', error.message);
    }
};

module.exports = sendSMS;
