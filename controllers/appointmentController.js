const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const mongoose = require('mongoose');
const { sendEmail } = require('../services/emailService');
const cloudinary = require('../configs/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

exports.bookAppointment = asyncHandler(async (req, res, next) => {

        const { doctorId, date, time } = req.body;

        // Get patient profile
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) {
          return next({
            statusCode: 401,
            message: 'Patient profile not found'
          });
        }

        // Get doctor
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
          return next({
                statusCode: 404,
                message: 'Invalid doctor ID'
            });
        }

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
          return next({
                statusCode: 404,
                message: 'Doctor not found'
            });
        }

        const appointmentDate = new Date(date);
        const now = new Date();

        if (appointmentDate < now) {
          return next({
                statusCode: 400,
                message: 'Cannot book appointment in the past'
            });
        }

        // Check availability
        const day = new Date(date).toLocaleString('en-US', { weekday: 'long' });

        const dayAvailability = doctor.availability.find(d => d.day === day);

        if (!dayAvailability || !dayAvailability.slots.includes(time)) {
          return next({
                statusCode: 400,
                message: 'Doctor not available at this time'
            });
        }

        // Prevent double booking
        const existing = await Appointment.findOne({ 
            doctor: doctorId,
            date,
            time,
            status: 'booked'
        });

        if (existing) {
          return next({
                statusCode: 400,
                message: 'Time slot already booked'
            });
        }

        // Create appointment 
        const appointment = await Appointment.create({
            doctor: doctorId,
            patient: patient._id,
            date: appointmentDate,
            time
        });

        // Populate user emails
        const populatedPatient = await Patient.findById(patient._id).populate('user');
        const populatedDoctor = await Doctor.findById(doctorId).populate('user');

        // Patient email
        await sendEmail({
            to: populatedPatient.user.email,
            subject: 'Appointment Confirmation',
            html:`
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">

      <!-- HEADER -->
      <div style="background:#0f172a; color:white; padding:20px;">
        <h2 style="margin:0;">PuraMedX</h2>
        <p style="margin:0; font-size:14px;">Smart Healthcare System</p>
      </div>

      <!-- BODY -->
      <div style="padding:20px; color:#333;">
        <h3>Appointment Confirmed</h3>
        <p>Your appointment has been successfully booked.</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
          <p><b>Date:</b> ${appointmentDate.toDateString()}</p>
          <p><b>Time:</b> ${time}</p>
        </div>

        <p style="margin-top:20px;">Thank you for choosing <b>PuraMedX</b>.</p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f9fafb; padding:15px; font-size:12px; color:#666; text-align:center;">
        © ${new Date().getFullYear()} PuraMedX. All rights reserved.
      </div>

    </div>
  </div>
`
});

        // Doctor email
        await sendEmail({
            to: populatedDoctor.user.email,
            subject: 'New Appointment Confirmation',
            html:`
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">

      <!-- HEADER -->
      <div style="background:#0f172a; color:white; padding:20px;">
        <h2 style="margin:0;">PuraMedX</h2>
        <p style="margin:0; font-size:14px;">Smart Healthcare System</p>
      </div>

      <!-- BODY -->
      <div style="padding:20px; color:#333;">
        <h3>New Appointment Booked</h3>
        <p>A patient has booked an appointment with you.</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
          <p><b>Date:</b> ${appointmentDate.toDateString()}</p>
          <p><b>Time:</b> ${time}</p>
        </div>

        <p style="margin-top:20px;">Thank you for choosing <b>PuraMedX</b>.</p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f9fafb; padding:15px; font-size:12px; color:#666; text-align:center;">
        © ${new Date().getFullYear()} PuraMedX. All rights reserved.
      </div>

    </div>
  </div>
`
});

        res.status(201).json({
            success: true,
            data: appointment
        });
});

exports.cancelAppointment = asyncHandler(async (req, res, next) => {

        const { id } = req.params;

        // Get appointment + patient + doctor (with user emails)
        const appointment = await Appointment.findById(id)
        .populate({
            path: 'patient',
            populate: { path: 'user', select: 'email name' }
        })
        .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'email name' }
        });

    // OPTIONAL: restrict who can access
    const isPatientOwner = 
        appointment.patient.user._id.toString() === req.user._id.toString();

    const isDoctorOwner =
        appointment.doctor.user._id.toString() === req.user._id.toString();

        if (!isPatientOwner && !isDoctorOwner) {
          return next({
                statusCode: 403,
                message: 'Not authorized to cancel this appointment'
            });
          }

        if (!appointment) {
          return next({
                statusCode: 404,
                message: 'Appointment not found'
            });
        }

        if (appointment.status === 'cancelled') {
          return next({
            statusCode: 400,
            message: 'Appointment already cancelled'
          });
        }

        // Update status
        appointment.status = 'cancelled';
        await appointment.save();

        // Email: notify patient
        await sendEmail({
            to: appointment.patient.user.email,
            subject: 'Appointment Cancellation',
            html:`
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">

      <!-- HEADER -->
      <div style="background:#0f172a; color:white; padding:20px;">
        <h2 style="margin:0;">PuraMedX</h2>
        <p style="margin:0; font-size:14px;">Smart Healthcare System</p>
      </div>

      <!-- BODY -->
      <div style="padding:20px; color:#333;">
        <h3>Appointment Cancelled</h3>
        <p>Your appointment has been successfully cancelled.</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
          <p><b>Date:</b> ${new Date(appointment.date).toDateString()}</p>
          <p><b>Time:</b> ${appointment.time}</p>
        </div>

        <p style="margin-top:20px;">Thank you for choosing <b>PuraMedX</b>.</p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f9fafb; padding:15px; font-size:12px; color:#666; text-align:center;">
        © ${new Date().getFullYear()} PuraMedX. All rights reserved.
      </div>

    </div>
  </div>
`
});

        await sendEmail({
            to: appointment.doctor.user.email,
            subject: 'Appointment Cancellation',
            html:`
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">

      <!-- HEADER -->
      <div style="background:#0f172a; color:white; padding:20px;">
        <h2 style="margin:0;">PuraMedX</h2>
        <p style="margin:0; font-size:14px;">Smart Healthcare System</p>
      </div>

      <!-- BODY -->
      <div style="padding:20px; color:#333;">
        <h3>Appointment Cancelled</h3>
        <p>A patient appointment with you has been successfully cancelled.</p>

        <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
          <p><b>Date:</b> ${new Date(appointment.date).toDateString()}</p>
          <p><b>Time:</b> ${appointment.time}</p>
        </div>

        <p style="margin-top:20px;">Thank you for choosing <b>PuraMedX</b>.</p>
      </div>

      <!-- FOOTER -->
      <div style="background:#f9fafb; padding:15px; font-size:12px; color:#666; text-align:center;">
        © ${new Date().getFullYear()} PuraMedX. All rights reserved.
      </div>

    </div>
  </div>
`
});

        return res.json({
            success: true,
            message: 'Appointment cancelled'
         });
});

exports.uploadReport = asyncHandler(async (req, res, next) => {

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
                message: 'Not authorized to upload to this appointment'
            });
    }

    // File from multer
    const files = req.files;

    if (!files || files.length === 0) {
      return next({
                statusCode: 400,
                message: 'No files uploaded'
            });
    }

    // SAFE LOOP
    for (const file of files) {
      if (!file.path || !file.filename) continue;

      appointment.reports.push({
        public_id: file.filename,
        resource_type: file.mimetype.startsWith('image') ? 'image' : 'raw'
      });
    };

    await appointment.save(); 

    return res.status(200).json({
      success: true,
      message: 'Reports uploaded successfully',
      data: appointment
    });
});

exports.deleteReport = asyncHandler(async (req, res, next) => {

  const { id, reportId }= req.params;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return next({
                statusCode: 404,
                message: 'Appointment not found'
            });
  }

  const patient = await Patient.findOne({ user: req.user._id});

  if (!patient || appointment.patient.toString() !== patient._id.toString()) {
    return next({
                statusCode: 403,
                message: 'Not authorized to delete this report'
            });
  }

  const report = appointment.reports.id(reportId);

  if (!report) {
    return next({
                statusCode: 404,
                message: 'Report not found'
            });
  }

  // Delete from cloudinary
  let result = await cloudinary.uploader.destroy(report.public_id, {
    resource_type: 'image',
    type: 'authenticated'
  });
  
  if (!result || result.result !== 'ok') {
    result = await cloudinary.uploader.destroy(report.public_id, {
    resource_type: 'raw',
    type: 'authenticated'
  });
}

  if (result.result !== 'ok') {
    return next({
                statusCode: 500,
                message: 'Failed to delete file from Cloudinary'
            });
  }

  // Remove from DB
  report.deleteOne();
  await appointment.save();

  res.json({
    success: true,
    message: "Report deleted successfully"
  });
});

exports.getAppointmentReports = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'id_ email' }
      })

      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'id_ email' }
      });

    if (!appointment) {
      return next({
                statusCode: 404,
                message: 'Appointment not found'
            });
    }

    // Auth check
    const patientProfile = await Patient.findOne({ user: req.user._id });

    const doctorProfile = await Doctor.findOne({ user: req.user._id });

    const appointmentPatientId = appointment.patient?._id?.toString();

    const appointmentDoctorId = appointment.doctor?._id?.toString();

    const isPatient =
      patientProfile && appointmentPatientId === patientProfile._id.toString();

    const isDoctor =
      doctorProfile && appointmentDoctorId === doctorProfile._id.toString();

    if (!isPatient && !isDoctor) {
      return next({
                statusCode: 403,
                message: 'Not authorized to view reports'
            });
    }

    // Signed URL generation
    const reportsWithUrls = appointment.reports.map((report) => {
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

    return res.json({
      success: true,
      reports: reportsWithUrls
    });
});

exports.addDoctorNotes = asyncHandler(async (req, res, next) => {

    const { id } = req.params;
    const { notes } = req.body;

    // Check Doctor
    const doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      return next({
                statusCode: 403,
                message: 'Not authorized, Only doctors can add notes'
            });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return next({
                statusCode: 404,
                message: 'Appointment not found'
            });
    }

    // Ensure Doctor owns appointment
    if (!appointment.doctor.equals(doctor._id)) {
      return next({
                statusCode: 403,
                message: 'Not authorized for this appointment'
            });
    }

    // Update notes
    appointment.notes = notes;

    // OPTIONAL: mark as completed
    appointment.status = 'completed';

    await appointment.save();

    return res.json({
      success: true,
      message: 'Notes added succesfully',
      data: appointment
    });
});