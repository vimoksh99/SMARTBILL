const express = require('express');
const { getNotifications, markAsRead, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getNotifications)
    .delete(protect, clearAllNotifications);
    
router.route('/:id/read').put(protect, markAsRead);

module.exports = router;
