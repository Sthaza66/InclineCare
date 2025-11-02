// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professional'], required: true },
  dateOfBirth: { type: String },
  course: { type: String },
  gender: { type: String },
  profilePic: { type: String, default: '' },
  description:{ type: String, default:"I Am a Professional"} ,
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
