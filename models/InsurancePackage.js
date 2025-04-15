const mongoose = require('mongoose');

const InsurancePackageSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'InsuranceProvider',
  },
  packageName: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['Basic', 'Premium', 'VIP', 'default'],
    default: 'Basic',
  },
});

module.exports = mongoose.model('InsurancePackage', InsurancePackageSchema);
