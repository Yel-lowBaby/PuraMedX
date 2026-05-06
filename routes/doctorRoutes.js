const express = require('express');
const router = express.Router();

const { createDoctorProfile }= require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getPatientHistoryForDoctor } = require('../controllers/doctorController');
const { getDoctorDashboard } = require('../controllers/doctorController');
const { getDoctors } = require('../controllers/doctorController');
const { getDoctorById } = require('../controllers/doctorController');

router.post('/', protect , authorize('doctor'), createDoctorProfile);
router.get('/patient/:patientId/history', protect, getPatientHistoryForDoctor);
router.get('/dashboard', protect, getDoctorDashboard);
router.get('/all', getDoctors);
router.get('/:doctorId/', getDoctorById);

module.exports = router;