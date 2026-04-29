const User = require('../models/User');
const sendResponse = require('../utils/responseFormatter');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');
const sendSMS = require('../utils/smsService');
const crypto = require('crypto');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user._id);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked
        }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user) {
            if (user.isVerified) {
                return sendResponse(res, 400, false, 'User already exists');
            } else {
                user.name = name;
                user.password = password;
                user.phone = phone;
            }
        } else {
            user = new User({ name, email, phone, password, isVerified: false });
        }

        const otp = user.generateEmailOTP();
        console.log(`\n==== NEW USER OTP GENERATED: ${otp} ====\n`);
        await user.save();
        
        // Send OTPs asynchronously to prevent blocking the response
        sendEmail({
            email: user.email,
            subject: 'Verify your SmartBill Account',
            message: `<h2>Welcome to SmartBill!</h2><p>Hi ${user.name}, please verify your account. Your OTP is: <strong>${otp}</strong></p>`
        }).catch(err => console.error('Failed to send verification email', err));

        if (user.phone) {
            sendSMS({
                phone: user.phone,
                message: `Welcome to SmartBill, ${user.name}! Your verification OTP is ${otp}.`
            }).catch(err => console.error('Failed to send verification SMS', err));
        }

        // Include OTP in response ONLY if email credentials are not set (for local testing)
        const responseData = !process.env.EMAIL_PASS ? { otp } : undefined;
        sendResponse(res, 200, true, 'OTP sent for verification', responseData);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, 400, false, 'Please provide email and password');
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return sendResponse(res, 401, false, 'Invalid credentials');
        }

        if (user.isBlocked) {
            return sendResponse(res, 403, false, 'Your account has been blocked by the admin');
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return sendResponse(res, 401, false, 'Invalid credentials');
        }

        // Bypass OTP for admin users
        if (user.role === 'admin') {
            return sendTokenResponse(user, 200, res);
        }

        const otp = user.generateEmailOTP();
        console.log(`\n==== LOGIN OTP GENERATED: ${otp} ====\n`);
        await user.save({ validateBeforeSave: false });

        // Send OTPs asynchronously
        sendEmail({
            email: user.email,
            subject: 'Login OTP - SmartBill',
            message: `<h2>Login Attempt</h2><p>Hi ${user.name}, your login OTP is: <strong>${otp}</strong></p>`
        }).catch(err => console.error('Failed to send login alert email', err));

        if (user.phone) {
            sendSMS({
                phone: user.phone,
                message: `SmartBill Login: Your OTP is ${otp}.`
            }).catch(err => console.error('Failed to send login alert SMS', err));
        }

        // Include OTP in response ONLY if email credentials are not set (for local testing)
        const responseData = !process.env.EMAIL_PASS ? { email: user.email, otp } : { email: user.email };
        sendResponse(res, 200, true, 'OTP sent for 2FA', responseData);
    } catch (err) {
        next(err);
    }
};

// @desc    Verify OTP for Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return sendResponse(res, 400, false, 'Please provide email and OTP');
        }

        const otpToken = crypto
            .createHash('sha256')
            .update(otp)
            .digest('hex');

        const user = await User.findOne({
            email,
            otpToken,
            otpTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return sendResponse(res, 400, false, 'Invalid or expired OTP');
        }

        user.isVerified = true;
        user.otpToken = undefined;
        user.otpTokenExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Resend OTP 
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return sendResponse(res, 400, false, 'Email is required');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        const otp = user.generateEmailOTP();
        console.log(`\n==== RESEND OTP GENERATED: ${otp} ====\n`);
        
        await user.save({ validateBeforeSave: false });

        sendEmail({
            email: user.email,
            subject: 'Your new SmartBill OTP',
            message: `<h2>OTP Verification</h2><p>Hi ${user.name}, your new OTP is: <strong>${otp}</strong></p>`
        }).catch(err => console.error('Failed to resend auth email', err));

        if (user.phone) {
            sendSMS({
                phone: user.phone,
                message: `SmartBill: Your new OTP is ${otp}.`
            }).catch(err => console.error('Failed to resend auth SMS', err));
        }

        // Include OTP in response ONLY if email credentials are not set (for local testing)
        const responseData = !process.env.EMAIL_PASS ? { otp } : undefined;
        sendResponse(res, 200, true, 'OTP resent via email and SMS', responseData);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        sendResponse(res, 200, true, 'User fetched', user);
    } catch (err) {
        next(err);
    }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    sendResponse(res, 200, true, 'User logged out');
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return sendResponse(res, 404, false, 'There is no user with that email');
        }

        // Get reset token (OTP)
        const otp = user.getOTP();
        await user.save({ validateBeforeSave: false });

        // Send OTPs asynchronously
        sendEmail({
            email: user.email,
            subject: 'Password Reset OTP - SmartBill',
            message: `<h2>Password Reset Request</h2><p>Your 6-digit OTP is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`
        }).catch(err => console.error('Failed to send forgot password email', err));

        if (user.phone) {
            sendSMS({
                phone: user.phone,
                message: `Your SmartBill password reset OTP is ${otp}. Valid for 10 minutes.`
            }).catch(err => console.error('Failed to send forgot password SMS', err));
        }

        // Include OTP in response ONLY if email credentials are not set (for local testing)
        const responseData = !process.env.EMAIL_PASS ? { otp } : undefined;
        sendResponse(res, 200, true, 'OTP sent to email and phone', responseData);
    } catch (err) {
        next(err);
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetToken = crypto
            .createHash('sha256')
            .update(req.body.otp || '')
            .digest('hex');

        const user = await User.findOne({
            email: req.body.email,
            resetToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return sendResponse(res, 400, false, 'Invalid or expired OTP');
        }

        // Set new password
        user.password = req.body.newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Update Password for Logged In User
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendResponse(res, 400, false, 'Please provide current and new password');
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return sendResponse(res, 401, false, 'Incorrect current password');
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Test Email Configuration
// @route   GET /api/auth/test-email
// @access  Public
exports.testEmail = async (req, res, next) => {
    try {
        const nodemailer = require('nodemailer');
        
        // Return environment variables state (without exposing full secrets)
        const envStatus = {
            EMAIL_USER_SET: !!process.env.EMAIL_USER,
            EMAIL_USER: process.env.EMAIL_USER,
            EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
            PASS_LENGTH: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(400).json({ success: false, message: 'Email credentials not set', env: envStatus });
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Try verifying connection
        await transporter.verify();

        return res.status(200).json({ 
            success: true, 
            message: 'Email configuration is perfect! Connection to SMTP successful.',
            env: envStatus 
        });

    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            message: 'Email configuration failed', 
            error: err.message,
            stack: err.stack,
            env: {
                EMAIL_USER_SET: !!process.env.EMAIL_USER,
                EMAIL_PASS_SET: !!process.env.EMAIL_PASS
            }
        });
    }
};
