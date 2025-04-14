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

router.get('/covid-questionnaire/check/:patientId', async (req, res) => {
  const { patientId } = req.params;
  try {
    const questionnaire = await CovidQuestionnaire.findOne({ patientId });
    if (questionnaire) {
      return res.json({ filled: true });
    } else {
      return res.json({ filled: false });
    }
  } catch (error) {
    console.error('Error checking COVID form:', error);
    res.status(500).json({ message: 'Error checking COVID form', error });
  }
});


// 📌 Doctor's appointments API (patients list only)
// routes/appointmentRoutes.js
// 📌 NEW API: Get booked slots for a doctor on a specific date
router.get('/appointments/doctor/:doctorId', async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const bookedSlots = appointments.map(app => app.time);

    res.status(200).json({ bookedSlots });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ message: 'Error fetching booked slots', error });
  }
});



// In appointmentRoutes.js

router.get('/appointments/doctor/:doctorId/booked-slots', async (req, res) => {
  const { doctorId } = req.params;

  try {
    const appointments = await Appointment.find({ doctorId: new mongoose.Types.ObjectId(doctorId) });
    const bookedTimes = appointments.map(app => app.time);
    res.status(200).json({ bookedTimes });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    res.status(500).json({ message: 'Error fetching booked slots', error });
  }
});


// 📌 Patient's Appointments
router.get('/appointments/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    const appointments = await Appointment.find({ patientId: patientId })
      .populate('doctorId')
      .sort({ date: 1, time: 1 });  // sort by date & time ascending

    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ message: 'Server error', error });
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

router.delete('/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;

  try {
    await Appointment.findByIdAndDelete(appointmentId);
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment', error });
  }
});


module.exports = router;


