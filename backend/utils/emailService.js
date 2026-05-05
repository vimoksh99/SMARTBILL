const nodemailer = require('nodemailer');
const dns = require('dns');

const resolveIPv4 = (domain) => {
    return new Promise((resolve, reject) => {
        dns.resolve4(domain, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses[0]);
        });
    });
};

let transporter;

const getTransporter = async () => {
    if (!transporter) {
        const smtpHost = await resolveIPv4('smtp.gmail.com');
        transporter = nodemailer.createTransport({
            pool: true,
            maxConnections: 1,
            host: smtpHost,
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                servername: "smtp.gmail.com"
            }
        });
    }
    return transporter;
};

const sendEmail = async (options) => {
    try {
        const mailer = await getTransporter();

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
