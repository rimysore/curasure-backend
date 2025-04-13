const express = require('express');
const Appointment = require('../models/Appointment');
const CovidQuestionnaire = require('../models/CovidQuestionnaire');
const mongoose = require('mongoose');   // 👈 Add this!


const router = express.Router();


// 📌 Book Appointment
router.post('/book-appointment', async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;

  try {
    const questionnaire = await CovidQuestionnaire.findOne({ patientId });

    if (!questionnaire) {
      return res.status(400).json({ message: 'You must complete the COVID-19 questionnaire before booking.' });
    }

    // ✅ FIRST: Check if time slot is already booked
    const existingAppointment = await Appointment.findOne({ doctorId, date, time });
    if (existingAppointment) {
      return res.status(400).json({ message: 'Selected time slot is already booked.' });
    }

    // ✅ THEN: Save new appointment
    const appointment = new Appointment({
      patientId: new mongoose.Types.ObjectId(patientId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date,
      time
    });

    await appointment.save();  // ✅ Save in MongoDB

    res.status(201).json({ message: 'Appointment booked successfully', data: appointment });
    
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});


// 📌 Doctor's appointments API (patients list only)
router.get('/appointments/doctor/:doctorId', async (req, res) => {
  const { doctorId } = req.params;

  try {
    const appointments = await Appointment.find({ doctorId: new mongoose.Types.ObjectId(doctorId) }).populate('patientId');
    const patients = appointments.map(app => app.patientId);  // Only patient info
    res.status(200).json({ patients });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ message: 'Error fetching doctor patients', error });
  }
});

// 📌 Doctor's full appointments list (date + time + patient info)
router.get('/appointments/list/:doctorId', async (req, res) => {
  const { doctorId } = req.params;

  try {
    const appointments = await Appointment.find({ doctorId: new mongoose.Types.ObjectId(doctorId) }).populate('patientId');
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

module.exports = router;


