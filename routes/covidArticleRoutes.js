const express = require('express');
const router = express.Router();
const CovidArticle = require('../models/CovidArticle');

router.post('/', async (req, res) => {
    try {
      console.log("📝 Incoming article payload:", req.body);
  
      const { providerId, title, content } = req.body;
      const newArticle = new CovidArticle({ providerId, title, content });
      await newArticle.save();
  
      res.status(201).json({ message: 'Article published successfully' });
    } catch (error) {
      console.error("❌ Error publishing article:", error.message);
      console.error(error.stack); // shows where it failed
      res.status(500).json({ message: 'Error publishing articles', error: error.message });
    }
  });
  

router.get('/', async (req, res) => {
  try {
    const articles = await CovidArticle.find().sort({ publishedAt: -1 });
    res.json({ articles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error });
  }
});

module.exports = router;
