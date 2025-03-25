const express = require('express');
const multer = require('multer');
const User = require('../models/Profile');
const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Store files in uploads folder
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

/**
 * 📌 Upload user profile picture
 */
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
});

module.exports = router;
