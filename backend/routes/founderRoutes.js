const express = require('express');
const router = express.Router();
const { getFounders, addFounder, deleteFounder } = require('../controllers/founderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getFounders) // public
    .post(protect, authorize('admin'), addFounder);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteFounder);

module.exports = router;
