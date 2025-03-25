const express = require('express');
const CovidQuestionnaire = require('../models/CovidQuestionnaire');
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

router.get('/covid-questionnaire/:patientId', async (req, res) => {
    const { patientId } = req.params;
  
    try {
      const questionnaire = await CovidQuestionnaire.findOne({ patientId });
  
      if (!questionnaire) {
        return res.status(404).json({ message: 'No COVID-19 questionnaire found for this patient.' });
      }
  
      res.status(200).json(questionnaire);
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      res.status(500).json({ message: 'Error fetching questionnaire', error });
    }
  });
  

module.exports = router;
