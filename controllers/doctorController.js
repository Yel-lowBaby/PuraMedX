const Doctor = require('../models/Doctor');
const appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const cloudinary = require('../configs/cloudinary');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');

exports.createDoctorProfile = asyncHandler(async (req, res, next) => {

        const { specialization, experience, gender, availability } = req.body

        // User comes from auth middleware
        const userId = req.user._id;

        // Prevent duplicate profile
        const existing = await Doctor.findOne ({ user: userId });
        if (existing) {
            return next({
                statusCode: 400,
                message: 'Doctor profile already exists'
            });
        }

        const doctor = await Doctor.create({
            user: userId,
            specialization,
            experience,
            gender,
            availability
        });

        res.status(201).json({
            success: true,
            data: doctor
        });
});

exports.getPatientHistoryForDoctor = asyncHandler(async (req, res, next) => {
    
        const { patientId } = req.params;

        // 1. Confirm logged-in user is a doctor
        const doctor = await Doctor.findOne({ user: req.user._id })

        if (!doctor) {
            return next({
                statusCode: 403,
                message: 'Only doctors can access patient history'
            });
        }

        // 2. Confirm patient exists
        const patient = await Patient.findById(patientId);

        if (!patient) {
            return next({
                statusCode: 404,
                message: 'Patient not found'
            });    
        }

        // 3. CRITICAL CHECK - Doctor must have at least one appointment with patient
        const hasRelationship = await Appointment.exists({
            patient: patient._id,
            doctor: doctor._id
        });

        if (!hasRelationship) {
            return next({
                statusCode: 403,
                message: 'Access denied: No relationship with this patient'
            });
        }

        // 4. Fetch appointments
        const appointments = await Appointment.find({ patient: patient._id })
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ date: -1 });

        // 5. Attach signed URLs
        const history = appointments.map(app => {

            const reports = app.reports.map(report => {
                const url = cloudinary.utils.private_download_url(
                    report.public_id,
                    undefined,
                    {
                        type: 'authenticated',
                        expires_at: Math.floor(Date.now() / 1000) + 300
                    }
                );

                return {
                    id: report._id,
                    url
                };
            });

                return {
                    appointmentId: app._id,

                    doctor: {
                        name: app.doctor?.user?.name,
                        email: app.doctor?.user?.email
                    },

                    schedule: {
                        date: app.date,
                        formattedDate: new Date(app.date).toDateString(),
                        time: app.time
                    },

                    status: app.status,
                    
                    statusLabel:
                        app.status === 'booked'
                            ? 'Appointment Booked'
                            : app.status === 'cancelled'
                            ? 'Appointment Cancelled'
                            : 'Consultation Completed',

                    notes: app.notes || 'No notes yet',

                    hasReports: reports.length > 0,
                    reportsCount: reports.length,
                    reports
                };
            });

            return res.json({
                success: true,
                count: history.length,
                data: history
            });
});

exports.getDoctorDashboard = asyncHandler(async (req, res, next) => {

        // 1. Confirm Doctor
        const doctor = await Doctor.findOne({ user: req.user._id });

        if (!doctor) {
            return next({
                statusCode: 403,
                message: 'Only doctors can access dashboard'
            });
        }

        // 2. Total appointments
        const totalAppointments = await Appointment.countDocuments({
            doctor: doctor._id
        });

        // 3. Completed appointments
        const completed = await Appointment.countDocuments({
            doctor: doctor._id,
            status: 'completed'
        });

        // 4. Upcoming appointments
        const upcoming = await Appointment.find({
            doctor: doctor._id,
            date: { $gte: new Date() },
            status: 'booked'
        })
            .sort({ date: 1 })
            .limit(5)
            .populate({
                path: 'patient',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            });

        // 5. Unique patients count
        const patients = await Appointment.distinct('patient', {
            doctor: doctor._id
        });

        return res.json({
            success: true,
            data: {
                totalAppointments,
                completeAppointments: completed,
                totalPatients: patients.length,
                upcomingAppointments: upcoming.map(app => ({
                    id: app._id,
                    patientName: app.patient?.user?.name,
                    date: app.date,
                    time: app.time
                }))
            }
        });
});

exports.getDoctors = asyncHandler(async (req, res) => {

    const doctors = await Doctor.find()
        .populate('user', 'name email');

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });
});

exports.getDoctorById = asyncHandler(async (req, res, next) => {

    const doctor = await Doctor.findById(req.params.id)
        .populate('user', 'name email');

    if (!doctor) {
        return next({
            statusCode: 404,
            message: 'Doctor not found'
        });
    }

    res.json({
        success: true,
        data: doctor
    });
});