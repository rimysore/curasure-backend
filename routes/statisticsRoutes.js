const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Bill = require('../models/Bill');


// Total amount paid grouped by patient and provider
router.get('/statistics/payments-summary', async (req, res) => {
  try {
    const stats = await Bill.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { patientId: "$patientId", providerId: "$providerId", packageId: "$packageId" },
          totalPaid: { $sum: "$amount" },
        }
      }
    ]);
    res.json({ stats });
  } catch (error) {
    console.error("Payment stats error:", error);
    res.status(500).json({ message: 'Error fetching payment statistics' });
  }
});

// GET /statistics/bill-status-summary/:providerId
router.get('/statistics/bill-status-summary/:providerId', async (req, res) => {
    const { providerId } = req.params;
    try {
      const summary = await Bill.aggregate([
        {
          $match: { providerId: new mongoose.Types.ObjectId(providerId) } // Filter by current provider
        },
        {
          $group: {
            _id: "$status", // 'paid' or 'unpaid'
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);
  
      res.json({ summary });
    } catch (error) {
      console.error("Bill status summary error:", error);
      res.status(500).json({ message: 'Error fetching bill status summary', error });
    }
  });
  

  router.post('/bills', async (req, res) => {
    const { patientId, providerId, packageId, amount, status } = req.body;
  
    try {
      const newBill = new Bill({ patientId, providerId, packageId, amount, status });
      await newBill.save();
      res.status(201).json({ message: 'Bill recorded successfully', bill: newBill });
    } catch (err) {
      res.status(500).json({ message: 'Error saving bill', error: err });
    }
  });

  // Delete a bill
router.delete('/bills/:patientId/:providerId/:packageId', async (req, res) => {
    const { patientId, providerId, packageId } = req.params;
  
    try {
      const deleted = await Bill.findOneAndDelete({ patientId, providerId, packageId });
  
      if (!deleted) {
        return res.status(404).json({ message: "Bill not found for given patient/provider/package." });
      }
  
      res.json({ message: "Bill deleted successfully.", deleted });
    } catch (error) {
      console.error("Error deleting bill:", error);
      res.status(500).json({ message: "Server error while deleting bill.", error });
    }
  });
  


  module.exports = router;