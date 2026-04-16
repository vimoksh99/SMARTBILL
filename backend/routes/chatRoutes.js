const express = require('express');
const { handleChat } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, handleChat);

module.exports = router;
