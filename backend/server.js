require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Import Jobs
const { startReminderJobs } = require('./jobs/reminderJobs');

// Initialize Express App
const app = express();

// Trust reverse proxy (fixes Render X-Forwarded-For error)
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors());

// Removed mongoSanitize due to IncomingMessage getter conflict

// Frontend decoupled; no static serving here

// Set up Global API Rate Limiting for all /api routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/founders', require('./routes/founderRoutes'));

// Global Error Handler Middleware
app.use(errorHandler);

// Start Cron Jobs
startReminderJobs();

// Seed Admins
const seedAdmin = async () => {
    try {
        const User = require('./models/User');
        const defaultAdmins = [
            { name: 'System Admin 1', email: 'admin1@smartbill.com' },
            { name: 'System Admin 2', email: 'admin2@smartbill.com' },
            { name: 'System Admin 3', email: 'admin3@smartbill.com' }
        ];

        for (let adminData of defaultAdmins) {
            const existingAdmin = await User.findOne({ email: adminData.email });
            if (!existingAdmin) {
                await User.create({
                    name: adminData.name,
                    email: adminData.email,
                    password: 'Smartbill@lpu.in',
                    role: 'admin'
                });
                console.log(`Admin seeded: ${adminData.email}`);
            }
        }
    } catch (err) {
        console.error('Failed to seed admins', err);
    }
};
seedAdmin();

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
