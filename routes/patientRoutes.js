// routes/patientRoutes.js
const express = require('express');
const Patient = require('../models/Patient');
const MedicalHistory = require('../models/MedicalHistory');   // 🛠️ add this
const Insurance = require('../models/Insurance');
const CovidQuestionnaire = require('../models/CovidQuestionnaire');  // ✅ Import correctly
const router = express.Router();

// 📌 Route to create a new patient (basic registration)
router.post('/patient', async (req, res) => {
  const { name, age, gender, contact, address } = req.body;

  if (!name || !age || !gender || !contact || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const patient = new Patient({
      name,
      age,
      gender,
      contact,
      address
    });

    await patient.save();
    res.status(201).json({ message: 'Patient created successfully', patient });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ message: 'Error creating patient', error });
  }
});

// 📌 Route to get full details for a patient (Basic Info + COVID Questionnaire + Medical + Insurance)
router.get('/patient/:patientId/full-details', async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    const covidData = await CovidQuestionnaire.findOne({ patientId });
    const medicalHistory = await MedicalHistory.findOne({ patientId });
    const insuranceData = await Insurance.findOne({ patientId });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientWithFullInfo = {
      ...patient.toObject(),   // basic patient info
      testedPositive: covidData?.needCovidTest ?? false,
      symptoms: [
        covidData?.fever && "Fever",
        covidData?.cough && "Cough",
        covidData?.breathingDifficulty && "Breathing Difficulty",
      ].filter(Boolean),
      testDate: covidData?.createdAt || null,

      // ✅ Include medical history and insurance
      medicalConditions: medicalHistory?.conditions || [],
      insuranceCompany: insuranceData?.companyName || "N/A",
      insuranceStatus: insuranceData?.coverageStatus || "N/A"
    };

    res.json({ patient: patientWithFullInfo }); // ✅ return nicely structured
  } catch (error) {
    console.error('Error fetching full patient details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});





router.put('/patient/:patientId/update-medical-info', async (req, res) => {
  const { patientId } = req.params;
  const { medicalConditions, insuranceCompany, insuranceStatus } = req.body;

  try {
    let medicalHistory = await MedicalHistory.findOne({ patientId });
    if (medicalHistory) {
      medicalHistory.conditions = medicalConditions;
      await medicalHistory.save();
    } else {
      await MedicalHistory.create({ patientId, conditions: medicalConditions });
    }

    let insurance = await Insurance.findOne({ patientId });
    if (insurance) {
      insurance.companyName = insuranceCompany;
      insurance.coverageStatus = insuranceStatus;
      await insurance.save();
    } else {
      await Insurance.create({ patientId, companyName: insuranceCompany, coverageStatus: insuranceStatus });
    }

    res.status(200).json({ message: 'Medical and insurance information updated successfully.' });
  } catch (error) {
    console.error('Error updating medical and insurance info:', error);
    res.status(500).json({ message: 'Error updating medical and insurance info', error });
  }
});



module.exports = router;
