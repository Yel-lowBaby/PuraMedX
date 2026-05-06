const mongoose = require('mongoose');

const userSchema = new mongoose.Schema (
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        unique: true,
        required: true,
        match: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
        minlength: 8,
    },

    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        default: 'patient'
    },

    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);