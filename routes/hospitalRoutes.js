const express = require('express');
const Hospital = require('../models/Hospital');
const router = express.Router();

// 📌 Add a new hospital
router.post('/hospital', async (req, res) => {
    const { name, address, contactNumber, covidCareSupport } = req.body;

    if (!name || !address || !contactNumber) {
        return res.status(400).json({ message: 'Name, address, and contact number are required' });
    }

    try {
        const newHospital = new Hospital({
            name,
            address,
            contactNumber,
            covidCareSupport: covidCareSupport || false
        });

        await newHospital.save();
        res.status(201).json({ message: 'Hospital added successfully', data: newHospital });
    } catch (error) {
        console.error('Error adding hospital:', error);
        res.status(500).json({ message: 'Error adding hospital', error });
    }
});


// Get all hospitals
router.get('/hospitals', async (req, res) => {
    try {
        const hospitals = await Hospital.find();  // Make sure the query is working
        if (hospitals.length === 0) {
            return res.status(404).json({ message: 'No hospitals found' });
        }
        res.status(200).json(hospitals);  // Respond with the hospitals data
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ message: 'Error fetching hospitals', error });
    }
});


// Route to check bed availability in a hospital
router.get('/hospital/:hospitalId/bed-availability', async (req, res) => {
  const { hospitalId } = req.params;

  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    res.json({ bedsAvailable: hospital.bedsAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Error checking bed availability', error });
  }
});

module.exports = router;
