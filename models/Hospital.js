const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    covidCareSupport: { type: Boolean, default: false } // Whether hospital supports COVID care
});

module.exports = mongoose.model('Hospital', HospitalSchema);
