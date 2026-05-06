const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendEmail } = require('../services/emailService');

cron.schedule('*/10 * * * *', async () => {
  const now = new Date();
  const in30mins = new Date(now.getTime() + 30 * 60000);

  const upcoming = await Appointment.find({
    date: { $gte: now, $lte: in30mins },
    status: 'booked'
  })
  .populate({
    path: 'patient',
    populate: { path: 'user', select: 'email name' }
  });

  for (let app of upcoming) {
    await sendEmail({
  to: app.patient.user.email,
  subject: 'Appointment Reminder - PuraMedX',
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
      
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background-color: #0f766e; color: white; padding: 20px; text-align: center;">
          <h2>PuraMedX</h2>
          <p>Healthcare Simplified</p>
        </div>

        <!-- Body -->
        <div style="padding: 20px; color: #333;">
          <h3>Appointment Reminder</h3>
          <p>Hello ${app.patient.user.name},</p>

          <p>This is a reminder that you have an upcoming appointment.</p>

          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Date:</strong> ${new Date(app.date).toDateString()}</p>
            <p><strong>Time:</strong> ${app.time}</p>
          </div>

          <p>Please ensure you arrive on time.</p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; text-align: center; padding: 15px; font-size: 12px;">
          <p>PuraMedX &copy; ${new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
  `
    });
  }
});