const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'patient' },
    name: { type: String },  // Add this line
    theme: { type: String, default: 'default' },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
}, { timestamps: true ,collection:'Users'});

module.exports = mongoose.model('User', UserSchema);
