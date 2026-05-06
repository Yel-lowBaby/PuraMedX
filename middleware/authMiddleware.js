const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {

        let token;

        // Get token from header
        if (
            req.headers.authorization && 
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        // No token
        if (!token) {
            return next({
                statusCode: 401,
                message: 'Not authorized, no token'
            });
        }

        // Verify token
        let decoded;
        
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch(err) {
            return next({
                statusCode: 401,
                message: 'Session expired or invalid token. Please log in again'
            });
        }

        // Get user
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next({
                statusCode: 401,
                message: 'User not found'
            });
        }

        // Attach user to request
        req.user = user;

        next();
});

exports.optionalProtect = asyncHandler(async (req, res, next) => {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');

            if (user) {
                req.user = user;
            }

        } catch(err) {
            // ignore invalid token (this is optional auth)
        }

        next();
    }
});