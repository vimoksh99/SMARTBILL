const Settings = require('../models/Settings');

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        // If no settings document exists yet, create a default one
        if (!settings) {
            settings = await Settings.create({});
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    try {
        const { supportEmail, supportPhone, supportAddress } = req.body;
        
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = await Settings.create({});
        }

        if (supportEmail) settings.supportEmail = supportEmail;
        if (supportPhone) settings.supportPhone = supportPhone;
        if (supportAddress) settings.supportAddress = supportAddress;

        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error updating settings' });
    }
};
