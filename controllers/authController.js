const User = require('../models/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

// Generate Tokens
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};


const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

const generateTokens = (user) => {
return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
    };
};

// REGISTER
exports.register = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

try{
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
        return next({
                statusCode: 400,
                message: 'All fields are required'
            });
    }

    // Password validation
    const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

    if (!passwordRegex.test(password)) {
        return next({
                statusCode: 400,
                message: `Password must contain:
                - At least 8 characters
                - One uppercase letter
                - One lowercase letter
                - One number
                - One special character`
            });
    }

    // Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next({
                statusCode: 400,
                message: 'User already exixts'
            });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Never allow admin from public registration
    let userRole = 'patient';

    if (role === 'doctor') {
        userRole = 'doctor';
    }

    // Create user
    const user = await User.create(
       [ 
        {
        name,
        email,
        password: hashedPassword,
        role: userRole
         }
       ],
       { session }
);

    // Generate tokens
    const tokens = generateTokens(user[0]);

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await session.commitTransaction();
    return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user[0],
        accessToken: tokens.accessToken,
    });

} catch(error) {
    // Rollback EVERYTHING
    await session.abortTransaction();
    return next(error);

} finally {
    session.endSession(); // always run
}
};

exports.login = asyncHandler(async (req, res, next) => {
    
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return next({
                statusCode: 400,
                message: 'Email and password are required'
            });
    }

    // Find user
    const user = await User.findOne({ email });

    // Auth validation
    if (!user) {
        return next({
                statusCode: 400,
                message: 'Invalid credentials'
            });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return next({
                statusCode: 400,
                message: 'Invalid credentials'
            });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken: tokens.accessToken,
    });
});

exports.refreshToken = asyncHandler(async(req, res, next) => {
    const token = req.cookies.refreshToken;

    if (!token) {
         return next({
                statusCode: 401,
                message: 'No refresh token'
            });
    }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const accessToken = generateAccessToken({ _id: decoded.id });
        const newRefreshToken = generateRefreshToken({ _id: decoded.id });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            accessToken
        });
});

exports.logout = (req, res) => {
    res.clearCookie('refreshToken');

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};