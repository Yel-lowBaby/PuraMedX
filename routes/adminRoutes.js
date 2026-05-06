const express = require('express');
const router = express.Router();

const { createAdmin } = require('../controllers/adminController');
const { optionalProtect } = require('../middleware/authMiddleware');

router.post('/create-admin', optionalProtect, createAdmin);

module.exports = router;