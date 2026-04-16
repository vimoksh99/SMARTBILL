const express = require('express');
const { exportCSV, exportPDF } = require('../controllers/exportController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/csv', protect, exportCSV);
router.get('/pdf', protect, exportPDF);

module.exports = router;
