const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const InsuranceProvider = require('../models/InsuranceProvider');
const Subscription = require("../models/Subscription"); // ✅ import this if you have one
const Patient = require("../models/Patient");

const router = express.Router();

// POST /api/insurance-provider/register
router.post('/insurance', async (req, res) => {
  const { name, email, password, companyName } = req.body;

  try {
    const existing = await InsuranceProvider.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Provider already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const provider = new InsuranceProvider({
      name,
      email,
      password: hashedPassword,
      companyName
    });

    await provider.save();

    res.status(201).json({ message: 'Insurance provider registered successfully' });
  } catch (error) {
    console.error('Error registering provider:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Search first
router.get('/search', async (req, res) => {
    const { email, name } = req.query;
  
    console.log("👉 Incoming search query - email:", email, "name:", name);
  
    try {
      let providers;
  
      if (email) {
        providers = await InsuranceProvider.find({ email: email.toString().trim().toLowerCase() });
      } else if (name) {
        if (typeof name !== "string" || name.trim() === "") {
          console.log("❌ Invalid name query");
          return res.status(400).json({ message: "Invalid name parameter." });
        }
  
        console.log("🔍 Searching for provider by name:", name);
        providers = await InsuranceProvider.find({
          name: { $regex: name.toString().trim(), $options: "i" }
        });
      } else {
        return res.status(400).json({ message: "Missing search parameter (email or name)." });
      }
  
      console.log("✅ Providers found:", providers);
      res.json(providers);
    } catch (error) {
      console.error("🔥 Error fetching insurance providers:", error);
      res.status(500).json({ message: "Error fetching insurance providers", error });
    }
  });
  
  
router.get('/:id', async (req, res) => {
    try {
      const provider = await InsuranceProvider.findById(req.params.id).select('name');
      res.json({ provider });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching provider', error: err });
    }
  });

  
  // ✅ Then get by ID
  router.get('/insurance/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
      const provider = await InsuranceProvider.findById(providerId);
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }
      res.json({ provider });
    } catch (error) {
      console.error('Error fetching provider:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:id/subscribed-patients', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Step 1: Get all subscriptions for this provider
      const subscriptions = await Subscription.find({ providerId: id });
  
      // Step 2: Extract unique patientIds
      const patientIds = subscriptions.map((s) => s.patientId);
  
      // Step 3: Fetch patient names
      const patients = await Patient.find({ _id: { $in: patientIds } }).select('_id name');
  
      res.json({ patients });
    } catch (error) {
      console.error("🔥 Error fetching subscribed patients:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  // routes/providerRoutes.js


module.exports = router;