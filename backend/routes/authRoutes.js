const express = require('express');
const { register, login, getMe, logout, forgotPassword, resetPassword, updatePassword, verifyOtp, resendOtp, testEmail } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/test-email', testEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
