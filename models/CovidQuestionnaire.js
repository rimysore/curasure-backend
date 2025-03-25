const mongoose = require('mongoose');

const CovidQuestionnaireSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  fever: { type: Boolean, required: true },
  cough: { type: Boolean, required: true },
  breathingDifficulty: { type: Boolean, required: true },
  contactWithCovidPatient: { type: Boolean, required: true },
  needCovidTest: { type: Boolean, required: true },  // Patient requests a test
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CovidQuestionnaire', CovidQuestionnaireSchema);
