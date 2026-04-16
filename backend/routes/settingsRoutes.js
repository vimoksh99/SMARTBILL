const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getSettings) // public access
    .put(protect, authorize('admin'), updateSettings);

module.exports = router;
