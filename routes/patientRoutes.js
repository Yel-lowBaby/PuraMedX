const express = require('express');
const router = express.Router();

const { createPatientProfile } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getMyMedicalHistory } = require('../controllers/patientController');

router.post('/', protect, authorize('patient'), createPatientProfile);
router.get('/me/history', protect, getMyMedicalHistory);

module.exports = router;