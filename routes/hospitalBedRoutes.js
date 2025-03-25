const express = require('express');
const HospitalBed = require('../models/HospitalBed');
const router = express.Router();


// 📌 Get bed availability for a hospital
router.get('/hospital-beds/:hospitalId', async (req, res) => {
    const { hospitalId } = req.params;

    try {
        const bedInfo = await HospitalBed.findOne({ hospitalId });

        if (!bedInfo) {
            return res.status(404).json({ message: 'Hospital bed information not found' });
        }

        res.status(200).json(bedInfo);
    } catch (error) {
        console.error('Error fetching bed availability:', error);
        res.status(500).json({ message: 'Error fetching bed availability', error });
    }
});

// 📌 Update bed availability (Doctor admits/discharges a patient)
router.put('/hospital-beds/:hospitalId/update', async (req, res) => {
    const { hospitalId } = req.params;
    const { change } = req.body; // `change: -1` for admitting, `change: +1` for discharge

    try {
        const bedInfo = await HospitalBed.findOne({ hospitalId });

        if (!bedInfo) {
            return res.status(404).json({ message: 'Hospital bed information not found' });
        }

        if (change < 0 && bedInfo.availableBeds === 0) {
            return res.status(400).json({ message: 'No available beds' });
        }

        bedInfo.availableBeds += change;
        await bedInfo.save();

        res.status(200).json({ message: 'Bed availability updated', updatedBeds: bedInfo.availableBeds });
    } catch (error) {
        console.error('Error updating bed availability:', error);
        res.status(500).json({ message: 'Error updating bed availability', error });
    }
});

// 📌 Initialize hospital bed count
router.post('/hospital-beds', async (req, res) => {
    const { hospitalId, totalBeds } = req.body;

    try {
        const newHospitalBed = new HospitalBed({
            hospitalId,
            totalBeds,
            availableBeds: totalBeds
        });

        await newHospitalBed.save();
        res.status(201).json({ message: 'Hospital bed data added successfully', data: newHospitalBed });
    } catch (error) {
        console.error('Error adding hospital bed data:', error);
        res.status(500).json({ message: 'Error adding hospital bed data', error });
    }
});

module.exports = router;
