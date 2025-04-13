const express = require('express');
const DoctorFeedback = require('../models/DoctorFeedback');
const Doctor = require('../models/Doctor');
const router = express.Router();
const mongoose = require('mongoose');


// 📌 GET all feedbacks for a specific doctor
router.get('/feedback/:doctorId', async (req, res) => {
  try {
    console.log('Doctor feedbacks:', feedbacks);
console.log('Calculated avg rating:', avgRating);
    const { doctorId } = req.params;
    const feedbacks = await DoctorFeedback.find({ doctorId: new mongoose.Types.ObjectId(doctorId) })
      .populate('patientId', 'name');  // populate patient name
    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Error fetching feedbacks', error });
  }
});

router.get('/feedback/test', (req, res) => {
  res.send('Feedback route is working!');
});

// Route to submit doctor feedback
router.post('/feedback', async (req, res) => {
  const { doctorId, patientId, rating, review } = req.body;

  if (rating === undefined) {
    return res.status(400).json({ message: 'Rating is required' });
  }

  try {
    const feedback = new DoctorFeedback({
      doctorId,
      patientId,
      rating,
      review
    });

    await feedback.save();

    // Optionally, update the doctor's average rating
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      const totalFeedbacks = await DoctorFeedback.countDocuments({ doctorId });
      const totalRatingResult = await DoctorFeedback.aggregate([
        { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
        { $group: { _id: null, totalRating: { $sum: '$rating' } } }
      ]);

      if (totalRatingResult.length > 0) {
        doctor.rating = totalRatingResult[0].totalRating / totalFeedbacks;
      } else {
        doctor.rating = 0;  // If no feedbacks are present, set default rating to 0
      }

      await doctor.save();
    }

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error });
  }
});


module.exports = router;
