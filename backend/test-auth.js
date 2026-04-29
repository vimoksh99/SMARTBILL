const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const sendEmail = require('./utils/emailService');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
        
        const testUser = {
            name: "Test User",
            email: "vemurivimokshram@gmail.com"
        };
        
        // Simulating the exact logic from authController
        console.log('Generating dummy OTP...');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log(`==== LOGIN OTP GENERATED: ${otp} ====`);
        
        console.log('Attempting to send email via emailService...');
        await sendEmail({
            email: testUser.email,
            subject: 'Login OTP - SmartBill Test',
            message: `<h2>Login Attempt</h2><p>Hi ${testUser.name}, your login OTP is: <strong>${otp}</strong></p>`
        });
        
        console.log('Email sent successfully!');
    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        mongoose.disconnect();
    }
}

test();
