const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getUsers,
    toggleBlockUser,
    deleteUser,
    getComplaints,
    updateComplaintStatus,
    getDashboardStats
} = require('../controllers/adminController');

const router = express.Router();

// Public route to manually seed admins on Vercel
router.get('/seed-manual', require('../controllers/adminController').manualSeedAdmin);

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);
router.get('/complaints', getComplaints);
router.put('/complaints/:id', updateComplaintStatus);
router.get('/dashboard', getDashboardStats);

module.exports = router;
