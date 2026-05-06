const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },

        specialization: {
            type: String,
            required: true
        },

        experience: {
            type: Number, // years
            required: true
        },

        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },

        availability: [
            {
                day: {
                    type: String,
                    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                },
                slots: [String] // e.g. ["09:00", "10:00"]
            }
        ]
    }, {
        timestamps: true
    }
);

module.exports = mongoose.model('Doctor', doctorSchema);