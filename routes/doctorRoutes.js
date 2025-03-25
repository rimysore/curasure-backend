const express = require('express');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');
const DoctorFeedback = require('../models/DoctorFeedback');  // Import the feedback model
const router = express.Router();


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

  // Check if required fields are missing
  if (!name || !specialization || !hospital || !experience) {
    return res.status(400).json({
      message: 'Name, specialization, hospital, and experience are required'
    });
  }

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

// Route to get doctor profile along with feedback by doctorId
router.get('/doctor/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the doctor profile by ID
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Fetch feedback associated with the doctor
    const feedbacks = await DoctorFeedback.find({ doctorId: id });

    // Combine the doctor profile and feedbacks
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







