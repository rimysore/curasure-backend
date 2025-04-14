// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true , default: 0 },
  gender: { type: String, required: true , default: "Not Specified" },
  contact: { type: String, required: true , default: "Not Provided" },
  address: { type: String, required: true , default: "Not Provided" },
  profilePicture: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
