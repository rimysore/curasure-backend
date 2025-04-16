const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/UserData');
const Doctor = require('../models/Doctor');
const InsuranceProvider = require('../models/InsuranceProvider');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Subscription = require('../models/Subscription');
const mongoose = require('mongoose');

router.get("/group/doctors", async (req, res) => {
    try {
        const messages = await Message.find({ isGroup: true, group: "doctors" })
          .sort({ timestamp: 1 })
          .select("senderId message timestamp");
        
        res.json(messages);
      } catch (err) {
        console.error("❌ Error loading doctor group messages:", err);
        res.status(500).json({ message: "Server error", error: err });
      }
  });

router.get('/users/:userId/:role', async (req, res) => {
    const { userId, role } = req.params;
  
    try {
      if (role === 'patient') {
        const appointments = await Appointment.find({
          patientId: new mongoose.Types.ObjectId(userId),
        });
  
        const rawDoctorIds = appointments
          .map((a) => a.doctorId?.toString())
          .filter((id) => !!id);
  
        const uniqueDoctorIds = [...new Set(rawDoctorIds)];
  
        const doctors = await Doctor.find({
          _id: { $in: uniqueDoctorIds },
        }).select('_id name specialization');
        const insuranceProviders = await InsuranceProvider.find().select('_id name');
  
        return res.json([
            ...doctors.map(doc => ({ ...doc.toObject(), type: 'doctor' })),
            ...insuranceProviders.map(ins => ({ ...ins.toObject(), type: 'insurance' }))
          ]);
      } else if (role === 'doctor') {
        const appointments = await Appointment.find({ doctorId: userId });

      const patientIds = appointments
        .map((a) => a.patientId?.toString())
        .filter(Boolean);

      const uniquePatientIds = [...new Set(patientIds)];

      const patients = await Patient.find({
        _id: { $in: uniquePatientIds }
      }).select('_id name'); // Add other fields if needed

      return res.json(patients);
      }else if (role === 'insurance') {
        // ✅ Find patients who are subscribed to this insurance provider
        const subscriptions = await Subscription.find({ providerId: new mongoose.Types.ObjectId(userId) });

  const patientIds = subscriptions.map((s) => s.patientId?.toString()).filter(Boolean);
  const uniquePatientIds = [...new Set(patientIds)];

  const patients = await Patient.find({ _id: { $in: uniquePatientIds } }).select('_id name profilePicture');

  return res.json(
    patients.map((p) => ({
      _id: p._id,
      name: p.name,
      profilePicture: p.profilePicture,
      type: "patient"
    }))
  );
      }
  
      // If role is neither patient nor doctor
      res.status(400).json({ message: "Invalid role" });
    } catch (err) {
      console.error("🔥 Chat user fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });


  

// ✅ Get private chat between two users
router.get('/messages/:senderId/:receiverId', async (req, res) => {
  const { senderId, receiverId } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  }).sort('timestamp');

  res.json(messages);
});

module.exports = router;
