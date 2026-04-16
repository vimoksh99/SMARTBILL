const axios = require('axios');

const sendSMS = async (options) => {
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
