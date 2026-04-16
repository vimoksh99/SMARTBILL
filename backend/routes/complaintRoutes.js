const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { submitComplaint, getMyComplaints } = require('../controllers/complaintController');

const router = express.Router();

router.post('/', protect, submitComplaint);
router.get('/my', protect, getMyComplaints);

module.exports = router;
