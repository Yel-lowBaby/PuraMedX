const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

// Create Admin (With Bootstrap)
exports.createAdmin = asyncHandler(async (req, res, next) => {

        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return next({
                statusCode: 401,
                message: 'All fields are required'
            });
        }

       // Check if admin already exists
       const adminCount = await User.countDocuments({ role: 'admin' });

       // If no admin exists -> allow bootstap
       if (adminCount === 0) {
            
        const existing = await User.findOne({ email });
        if (existing) {
            return next({
                statusCode: 400,
                message: 'User already exixts'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        return res.status(201).json({
            success: true,
            message: 'First admin created successfully',
            data: {
                id: admin._id,
                email: admin.email
            }
        });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
        return next({
            statusCode: 400,
            message: 'User already exists'
        });
    }
    
    // If admin exists -> only admin can create another
    if (!req.user || req.user.role !== 'admin') {
        return next({
            statusCode: 403,
            message: 'Only admins can create another admin'
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin'
    });

    return res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
            id: newAdmin._id,
            email: newAdmin.email
        }
    });
});