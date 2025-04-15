// routes/subscriptionRoutes.js
const express           = require('express');
const router            = express.Router();
const Subscription      = require('../models/Subscription');
const Patient           = require('../models/Patient');
const InsurancePackage  = require('../models/InsurancePackage');
const InsuranceProvider = require('../models/InsuranceProvider');

// Get all subscribed patients for a provider
router.get('/subscriptions/provider/:providerId', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ providerId: req.params.providerId }).populate({
      path: 'patientId',
      select: 'name gender contact age' // exclude image
    });

    // Map to a clean structure
    const result = subscriptions.map(sub => ({
      _id: sub._id,
      createdAt: sub.createdAt,
      patient: sub.patientId, // already populated
    }));

    res.json({ subscriptions: result });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribed patients', error });
  }
});

// Get all insurance packages with provider details
router.get('/insurance-packages/all', async (req, res) => {
  try {
    const packages = await InsurancePackage.find().populate({
      path: 'providerId',
      select: 'name companyName' // Only fetch required fields
    });

    res.json({ packages });
  } catch (error) {
    console.error("Error fetching insurance packages:", error);
    res.status(500).json({ message: 'Server error while fetching packages', error });
  }
});

// Get subscriptions for a patient
router.get('/subscriptions/patient/:patientId', async (req, res) => {
  try {
    const subs = await Subscription.find({ patientId: req.params.patientId });
    res.json({ subscriptions: subs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions', error });
  }
});


// Unsubscribe route
router.post('/subscription/unsubscribe', async (req, res) => {
  const { providerId, patientId, packageId } = req.body;

  try {
    const result = await Subscription.findOneAndDelete({ providerId, patientId, packageId });
    if (!result) {
      return res.status(404).json({ message: 'No matching subscription found to delete.' });
    }

    res.json({ message: 'Successfully unsubscribed.', deletedSubscription: result });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ message: 'Error unsubscribing.', error });
  }
});



// POST - Subscribe a patient to a provider
router.post('/subscription/subscribe', async (req, res) => {
  const { providerId, patientId, packageId } = req.body;

  try {
    const existing = await Subscription.findOne({ providerId, patientId, packageId });
    if (existing) {
      return res.status(409).json({ message: 'Already subscribed.' });
    }

    const newSub = new Subscription({ providerId, patientId, packageId });
    await newSub.save();

    res.status(201).json({ message: 'Patient subscribed!', newSub });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});



module.exports = router;
