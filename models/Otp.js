const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneOrEmail: String,
  otp: String,
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);