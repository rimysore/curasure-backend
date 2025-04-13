// models/Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({

  name: { 
    type: String, 
    required: true 
  },
  specialization: { 
    type: String, 
    required: true 
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  rating: { 
    type: Number, 
    default: 0 
  }, // Average rating for the doctor
  experience: { 
    type: Number, 
    required: true 
  }, // Years of experience
  profilePicture: { 
    type: String,
    default:''
  }, // URL to profile picture
  available: { type: Boolean, default: true }, 
  covidCare: { type: Boolean, default: false },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }, // Timestamp when the profile is created
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
