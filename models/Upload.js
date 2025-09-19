const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  fileUrl: String,
  fileType: { type: String, enum: ['image','video'] },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Upload', uploadSchema);