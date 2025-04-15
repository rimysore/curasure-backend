// models/InsuranceProvider.js
const mongoose = require('mongoose');

const insuranceProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InsuranceProvider', insuranceProviderSchema);
