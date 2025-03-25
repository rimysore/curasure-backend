const CovidQuestionnaire = require('../models/CovidQuestionnaire');

router.post('/book-appointment', async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;

  // Check if patient has filled the questionnaire
  const questionnaire = await CovidQuestionnaire.findOne({ patientId });

  if (!questionnaire) {
    return res.status(400).json({ message: 'You must complete the COVID-19 questionnaire before booking.' });
  }

  // Proceed with appointment booking
});
