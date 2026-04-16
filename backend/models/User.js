const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    phone: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetToken: String,
    resetTokenExpiry: Date,
    otpToken: String,
    otpTokenExpiry: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password OTP
UserSchema.methods.getOTP = function () {
    // Generate 6 digit pin
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and set to resetToken field
    this.resetToken = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    // Set expire (10 mins)
    this.resetTokenExpiry = Date.now() + 10 * 60 * 1000;

    return otp;
};

// Generate and hash email OTP for login/signup
UserSchema.methods.generateEmailOTP = function () {
    // Generate 6 digit pin
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and set to otpToken field
    this.otpToken = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    // Set expire (10 mins)
    this.otpTokenExpiry = Date.now() + 10 * 60 * 1000;

    return otp;
};

module.exports = mongoose.model('User', UserSchema);
