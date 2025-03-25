const mongoose = require('mongoose');

const HospitalBedSchema = new mongoose.Schema({
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    totalBeds: { type: Number, required: true },
    availableBeds: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HospitalBed', HospitalBedSchema);
