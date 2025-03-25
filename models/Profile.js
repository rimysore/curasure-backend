const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    profilePicture: { type: String, default: '' } // Profile picture URL
});

module.exports = mongoose.model('Profile', userSchema);
