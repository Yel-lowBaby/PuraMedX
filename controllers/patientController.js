const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const cloudinary = require('../configs/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

exports.createPatientProfile = asyncHandler(async (req, res, next) => {

        const { age, gender, medicalHistory } = req.body;

        const userId = req.user._id;

        const existing = await Patient.findOne({ userId });
        if (existing) {
            return next({
                statusCode: 400,
                message: 'Patient profile already exixts'
            });
        }

        const patient = await Patient.create({
            user: userId,
            age,
            gender,
            medicalHistory
        });

        res.status(201).json({
            success: true,
            data: patient
        });
});

exports.getMyMedicalHistory = asyncHandler(async (req, res, next) => {

        // 1. Get patient profile
        const patient = await Patient.findOne({ user: req.user._id });

        if (!patient) {
            return next({
                statusCode: 404,
                message: 'Patient profile not found'
            });
        }

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // 2. Get appointments
        const filter = { patient: patient._id };

        if (req.query.status) {
            filter.status = {
                $regex: `${req.query.status}$`,
                $options: 'i'
            };
        }
    
        // Date filter (full-day match)
        if (req.query.date) {
            const start = new Date(req.query.date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(req.query.date);
            end.setHours(23, 59, 59, 999);

        filter.date = {
            $gte: start,
            $lte: end
        };
    }

        const total = await Appointment.countDocuments(filter);

        const appointments = await Appointment.find(filter)
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        // 3. Format response
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

            return{
                appointmentId: app._id,

                doctor: {
                    name: app.doctor?.user?.name,
                    email: app.doctor?.user?.email
                },

                schedule: {
                    date: app.date,
                    formattedDate:new Date(app.date).toDateString(),
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
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            count: history.length,
            data: history
        });
});