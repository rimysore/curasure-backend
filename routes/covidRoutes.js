const express = require('express');
const CovidQuestionnaire = require('../models/CovidQuestionnaire');
const Doctor = require('../models/Doctor');  
const Appointment = require('../models/Appointment');

const router = express.Router();

// Submit COVID-19 questionnaire
router.post('/covid-questionnaire', async (req, res) => {
  const { patientId, fever, cough, breathingDifficulty, contactWithCovidPatient, needCovidTest } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const questionnaire = new CovidQuestionnaire({
      patientId,
      fever,
      cough,
      breathingDifficulty,
      contactWithCovidPatient,
      needCovidTest
    });

    await questionnaire.save();
    res.status(201).json({ message: 'COVID-19 questionnaire submitted successfully' });
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    res.status(500).json({ message: 'Error submitting questionnaire', error });
  }
});

// Save COVID Questionnaire
router.post('/covid-questionnaire/:patientId', async (req, res) => {
  const { fever, cough, breathingDifficulty, needCovidTest } = req.body;
  const { patientId } = req.params;

  const questionnaire = new CovidQuestionnaire({
    patientId,
    fever,
    cough,
    breathingDifficulty,
    needCovidTest
  });

  await questionnaire.save();
  res.status(201).json({ message: "Questionnaire saved." });
});

// Submit Feedback
router.post('/feedback/:doctorId', async (req, res) => {
  const { rating, comment, patientId } = req.body;
  const { doctorId } = req.params;

  const feedback = new Feedback({
    doctorId,
    patientId,
    rating,
    comment
  });

  await feedback.save();
  res.status(201).json({ message: "Feedback submitted." });
});

// Get all doctors
router.get('/doctors', async (req, res) => {
  const doctors = await Doctor.find();
  res.json({ doctors });
});

  

module.exports = router;
