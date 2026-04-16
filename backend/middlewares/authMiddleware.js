const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendResponse = require('../utils/responseFormatter');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return sendResponse(res, 401, false, 'Not authorized to access this route');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return sendResponse(res, 401, false, 'User no longer exists');
        }
        
        if (req.user.isBlocked) {
            return sendResponse(res, 403, false, 'Your account has been blocked by the admin');
        }

        next();
    } catch (err) {
        return sendResponse(res, 401, false, 'Not authorized to access this route');
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return sendResponse(res, 403, false, `User role ${req.user.role} is not authorized to access this route`);
        }
        next();
    };
};

module.exports = { protect, authorize };
