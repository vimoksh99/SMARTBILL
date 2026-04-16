const mongoose = require('mongoose');

const founderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a founder name']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    imageBase64: {
        type: String,
        required: [true, 'Please provide base64 image data']
    }
}, { timestamps: true });

module.exports = mongoose.model('Founder', founderSchema);
