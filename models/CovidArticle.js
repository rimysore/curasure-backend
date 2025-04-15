const mongoose = require('mongoose');

const covidArticleSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsuranceProvider',
    required: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CovidArticle', covidArticleSchema); // ✅ CommonJS export
