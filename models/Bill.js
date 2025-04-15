const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    providerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceProvider', required: true },
    packageId:   { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePackage', required: true }, // ✅ Add this
    amount:      { type: Number, required: true },
    status:      { type: String, enum: ['paid', 'unpaid'], required: true },
    createdAt:   { type: Date, default: Date.now }
  });
  

module.exports = mongoose.model('Bill', BillSchema);