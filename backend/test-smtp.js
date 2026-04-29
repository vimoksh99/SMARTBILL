require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log("Using USER:", process.env.EMAIL_USER);
    // Don't log full pass, just length to verify
    console.log("Using PASS length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ SMTP Verification Successful");
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "vemurivimokshram@gmail.com",
            subject: "Test from SmartBill",
            text: "This is a test email."
        });
        console.log("✅ Test email sent! ID:", info.messageId);
    } catch (error) {
        console.error("❌ SMTP Error:", error);
    }
}
testEmail();
