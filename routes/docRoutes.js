const express = require('express');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');
const DoctorFeedback = require('../models/DoctorFeedback');  // Import the feedback model
const router = express.Router();

/**
 * 📌 Get all doctors with fresh updated ratings
 */
router.get('/doctors', async (req, res) => {
  try {
    let doctors = await Doctor.find().populate('hospital');  // Also populate hospital if needed

    // For each doctor, dynamically calculate rating
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doc) => {
        const totalFeedbacks = await DoctorFeedback.countDocuments({ doctorId: doc._id });
        const totalRatingResult = await DoctorFeedback.aggregate([
          { $match: { doctorId: doc._id } },
          { $group: { _id: null, totalRating: { $sum: '$rating' } } }
        ]);

        let avgRating = 0;
        if (totalFeedbacks > 0 && totalRatingResult.length > 0) {
          avgRating = totalRatingResult[0].totalRating / totalFeedbacks;
        }

        return {
          ...doc.toObject(),
          rating: avgRating.toFixed(1),  // ⭐ Here the final rating
        };
      })
    );

    res.status(200).json({ doctors: doctorsWithRatings });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors', error });
  }
});

// Route to create a doctor profile
router.post('/doctor', async (req, res) => {
  const { 
    name, 
    specialization, 
    hospital, 
    rating, 
    experience, 
    profilePicture, 
    available ,
    covidCare
  } = req.body;



  try {
    // Create a new doctor profile
    const doctor = new Doctor({
      name,
      specialization,
      hospital,
      rating: rating || 0, // Default to 0 if no rating is provided
      experience,
      profilePicture: profilePicture || '', // Default to an empty string if no profile picture is provided
      available,
      covidCare
    });

    await doctor.save();
    res.status(201).json({ message: 'Doctor profile created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving doctor profile', error });
  }
});




// 📌 Create this new PUT route to update doctor profile
router.put('/doctor/edit/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    specialization,
    experience,
    available,
    covidCare,
    hospital,
    rating,
    profilePicture
  } = req.body;

  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id.trim(),   // trim to be safe
      {
        $set: {
          name,
          specialization,
          experience,
          available,
          covidCare,
          hospital,
          rating,
          profilePicture,
        },
      },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ message: 'Doctor profile updated successfully', doctor: updatedDoctor });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ message: 'Error updating doctor profile', error });
  }
});

module.exports = router;


// Route to get doctor profile along with feedback by doctorId
router.get('/doctor/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const doctorId = id.trim(); // 🛠️ trim id if needed

    // 🛠️ Populate hospital here
    const doctor = await Doctor.findById(doctorId).populate('hospital');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Fetch feedbacks too
    const feedbacks = await DoctorFeedback.find({ doctorId: doctorId });

    const doctorProfileWithFeedback = {
      doctor,
      feedbacks
    };

    res.status(200).json(doctorProfileWithFeedback);
  } catch (error) {
    console.error('Error fetching doctor profile with feedback:', error);
    res.status(500).json({ message: 'Error fetching doctor profile with feedback', error });
  }
});


/**
 * 📌 Search doctors by name and specialization
 */
router.get('/doctors/search', async (req, res) => {
    const { name, specialization } = req.query;

    try {
        let query = {};

        if (name) {
            query.name = { $regex: new RegExp(name, 'i') }; // Case-insensitive search
        }
        if (specialization) {
            query.specialization = { $regex: new RegExp(specialization, 'i') };
        }

        const doctors = await Doctor.find(query);
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Error searching doctors:', error);
        res.status(500).json({ message: 'Error searching doctors', error });
    }
});

/**
 * 📌 Search doctors that support COVID-19 patient care
 */
router.get('/doctors/covid-support', async (req, res) => {
    try {
        const covidDoctors = await Doctor.find({ covidCare: true });
        res.status(200).json(covidDoctors);
    } catch (error) {
        console.error('Error fetching COVID-19 supporting doctors:', error);
        res.status(500).json({ message: 'Error fetching COVID-19 supporting doctors', error });
    }
});

/**
 * 📌 Get available appointment times for a doctor
 */
router.get('/doctors/:doctorId/available-times', async (req, res) => {
    const { doctorId } = req.params;

    try {
        // Fetch all booked appointments for this doctor
        const appointments = await Appointment.find({ doctorId }).select('date');

        // Assume doctor's working hours (9 AM - 5 PM) with 1-hour slots
        const workingHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];
        const bookedTimes = appointments.map(app => app.date.toISOString().split('T')[1].slice(0, 5));

        // Filter available times
        const availableTimes = workingHours.filter(time => !bookedTimes.includes(time));

        res.status(200).json({ doctorId, availableTimes });
    } catch (error) {
        console.error('Error fetching available times:', error);
        res.status(500).json({ message: 'Error fetching available times', error });
    }
});

router.post('/appointments', async (req, res) => {
    try {
      const { doctorId, patientId, date, time, email } = req.body;
  
      // Convert date string to start of the day to compare only date
      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);
  
      // Check if the slot is already booked
      const existingAppointment = await Appointment.findOne({
        doctorId,
        date: appointmentDate,  // Compare only date, ignoring time
        time: time  // Ensure the time matches as well
      });
  
      if (existingAppointment) {
        return res.status(400).json({ message: 'Selected time slot is already booked' });
      }
  
      // Create the appointment
      const newAppointment = new Appointment({ doctorId, patientId, date, time });
      await newAppointment.save();
  
      res.status(201).json({ message: 'Appointment booked successfully', data: newAppointment });
  
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ message: 'Error booking appointment', error });
    }
  });
  
  // routes/doctors.js
router.get('/doctors/available', async (req, res) => {
    try {
        // Fetch doctors who are available
        const availableDoctors = await Doctor.find({ available: true });

        if (availableDoctors.length === 0) {
            return res.status(404).json({ message: 'No available doctors' });
        }

        res.status(200).json(availableDoctors);
    } catch (error) {
        console.error('Error fetching available doctors:', error);
        res.status(500).json({ message: 'Error fetching available doctors', error });
    }
});


/**
 * 📌 Send confirmation email function
 */
async function sendConfirmationEmail(patientEmail, doctorName, date) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'MAIL_USER', // Replace with your email
            pass: 'MAIL_PASS'  // Replace with your app password
        }
    });

    let mailOptions = {
        from: 'rithviksit@gmail.com',
        to: patientEmail,
        subject: 'Appointment Confirmation',
        text: `Your appointment with Dr. ${doctorName} is confirmed on ${date}.`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = router;







