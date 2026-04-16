const express = require('express');
const { getBills, addBill, updateBill, deleteBill, getAnalytics } = require('../controllers/billController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/analytics').get(protect, getAnalytics);

router.route('/')
    .get(protect, getBills)
    .post(protect, addBill);

router.route('/:id')
    .put(protect, updateBill)
    .delete(protect, deleteBill);

module.exports = router;
