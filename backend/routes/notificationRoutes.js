const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/:id/read').put(protect, markAsRead);

module.exports = router;
