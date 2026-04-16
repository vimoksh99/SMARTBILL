const sendResponse = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 404;
        err.message = 'Resource not found';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        err.message = 'Duplicate field value entered';
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        err.message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    sendResponse(res, statusCode, false, err.message, process.env.NODE_ENV === 'production' ? null : err.stack);
};

module.exports = errorHandler;
