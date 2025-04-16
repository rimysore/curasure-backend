const express = require('express');

const User = require('../models/Profile');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const InsuranceProvider = require('../models/InsuranceProvider');

// GET /api/user/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check Doctor
    let user = await Doctor.findById(id).select('name profilePicture');
    if (user) return res.json({ name: user.name, profilePicture: user.profilePicture });

    // Check Patient
    user = await Patient.findById(id).select('name profilePicture');
    if (user) return res.json({ name: user.name, profilePicture: user.profilePicture });

    // Check Insurance Provider
    user = await InsuranceProvider.findById(id).select('name profilePicture');
    if (user) return res.json({ name: user.name, profilePicture: user.profilePicture });

    res.status(404).json({ message: 'User not found' });

  } catch (error) {
    console.error("🔥 Error fetching user profile:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


/**
 * 📌 Upload user profile picture

router.post('/users/:userId/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    const { userId } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = `/uploads/${req.file.filename}`;
        await user.save();

        res.status(200).json({ message: 'Profile picture uploaded successfully', profilePicture: user.profilePicture });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Error uploading profile picture', error });
    }
}); **/

module.exports = router;
