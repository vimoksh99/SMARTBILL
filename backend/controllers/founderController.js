const Founder = require('../models/Founder');
const sendResponse = require('../utils/responseFormatter');

// @desc    Get all founders
// @route   GET /api/founders
// @access  Public
exports.getFounders = async (req, res, next) => {
    try {
        const founders = await Founder.find();
        sendResponse(res, 200, true, 'Founders fetched', founders);
    } catch (err) {
        next(err);
    }
};

// @desc    Add new founder
// @route   POST /api/founders
// @access  Private/Admin
exports.addFounder = async (req, res, next) => {
    try {
        const { name, description, imageBase64 } = req.body;
        
        if (!name || !description || !imageBase64) {
            return sendResponse(res, 400, false, 'Please provide name, description, and image data');
        }

        const founder = await Founder.create({ name, description, imageBase64 });
        sendResponse(res, 201, true, 'Founder added successfully', founder);
    } catch (err) {
        next(err);
    }
};

// @desc    Delete founder
// @route   DELETE /api/founders/:id
// @access  Private/Admin
exports.deleteFounder = async (req, res, next) => {
    try {
        const founder = await Founder.findById(req.params.id);
        if (!founder) {
            return sendResponse(res, 404, false, 'Founder not found');
        }
        await founder.deleteOne();
        sendResponse(res, 200, true, 'Founder removed successfully');
    } catch (err) {
        next(err);
    }
};
