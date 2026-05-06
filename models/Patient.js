const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required : true,
            unique: true
        },

        age: Number,

        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },

        medicalHistory: [String]
    }, {
        timestamps: true
    }
);

module.exports = mongoose.model('Patient', patientSchema);