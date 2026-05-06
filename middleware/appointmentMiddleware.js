const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');

exports.checkAppointmentOwnership = asyncHandler(async (req, res, next) => {

        const { id } = req.params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return next({
                statusCode: 404,
                message: 'Appointment not found'
            });
        }

        const patient = await Patient.findOne({ user: req.user._id });

        if (!patient || appointment.patient.toString() !== patient._id.toString()) {
            return next({
                statusCode: 403,
                message: 'Not authorized for this appointment'
            });
        }

        req.appointment = appointment

        next(); // Allow upload to proceed
});