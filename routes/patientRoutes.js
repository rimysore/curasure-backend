// routes/patientRoutes.js
const express = require('express');
const Patient = require('../models/Patient');
const router = express.Router();

// Route to create a new patient
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
    res.status(500).json({ message: 'Error creating patient', error });
  }
});

module.exports = router;
