// models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceProvider', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePackage', required: true },
  subscribedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
