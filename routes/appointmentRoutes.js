const express = require('express');
const router = express.Router();

const { bookAppointment, cancelAppointment, uploadReport, getAppointmentReports } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { checkAppointmentOwnership } = require('../middleware/appointmentMiddleware')
const upload = require('../middleware/uploadMiddleware');
const { deleteReport } = require('../controllers/appointmentController');
const { getAppointmentRoutes } = require('../controllers/appointmentController');
const { addDoctorNotes } = require('../controllers/appointmentController');

router.post('/', protect, authorize('patient'), bookAppointment);
router.patch('/:id/cancel', protect, cancelAppointment);
router.post('/:id/upload', protect, authorize('patient'), checkAppointmentOwnership, upload.array('reports', 5), uploadReport);
router.delete('/:id/report/:reportId', protect, deleteReport);
router.get('/:id/reports', protect, getAppointmentReports);
router.patch('/:id/notes', protect, addDoctorNotes);

module.exports = router;