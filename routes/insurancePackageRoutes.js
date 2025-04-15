const express = require('express');
const router = express.Router();
const InsurancePackage = require('../models/InsurancePackage');


// ➡️ Create a new package
router.post('/insurance-package/create', async (req, res) => {
    const { providerId, packageName, description, price, type } = req.body;
  
    console.log("📥 Incoming Package Payload:", req.body);
  
    try {
      const newPackage = new InsurancePackage({ providerId, packageName, description, price, type });
      await newPackage.save();
      console.log("✅ Package Saved:", newPackage);
      res.status(201).json({ message: 'Package created', newPackage });
    } catch (error) {
      console.error("❌ Error saving package:", error);
      res.status(500).json({ message: 'Error creating package', error });
    }
  });

// ➡️ Get all packages by provider
router.get('/insurance-package/provider/:providerId', async (req, res) => {
  try {
    const packages = await InsurancePackage.find({ providerId: req.params.providerId });
    res.status(200).json({ packages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packages', error });
  }
});

// ➕ Get all packages with provider name
router.get('/insurance-packages/all', async (req, res) => {
    try {
      const packages = await InsurancePackage.find().populate({
        path: 'providerId',
        select: 'name companyName', // Only the necessary info
      });
  
      res.status(200).json({ packages });
    } catch (error) {
      console.error("❌ Error fetching all packages:", error);
      res.status(500).json({ message: 'Error fetching all packages', error });
    }
  });

// routes/insurancePackageRoutes.js
router.get('/insurance-packages/:id', async (req, res) => {
    try {
      const insurancePackage = await InsurancePackage.findById(req.params.id).select('packageName');
      res.json({ package: insurancePackage });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching package', error: err });
    }
  });
// ➡️ Update a package
router.put('/insurance-package/:id/edit', async (req, res) => {
  try {
    const updated = await InsurancePackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: 'Package updated', updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating package', error });
  }
});

// ➡️ Delete a package
router.delete('/insurance-package/:id/delete', async (req, res) => {
  try {
    await InsurancePackage.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting package', error });
  }
});

module.exports = router;
