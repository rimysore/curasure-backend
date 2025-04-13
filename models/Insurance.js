// models/Insurance.js
const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  companyName: { type: String },
  coverageStatus: { type: String }, // e.g., "Active", "Expired"
  createdAt: { type: Date, default: Date.now }
});

const Insurance = mongoose.model('Insurance', insuranceSchema);

module.exports = Insurance;

