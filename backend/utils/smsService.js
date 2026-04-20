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

    // Mock SMS since Fast2SMS was removed
    console.log(`[MOCK SMS] To: ${options.phone}, Message: ${options.message}`);
};

module.exports = sendSMS;
