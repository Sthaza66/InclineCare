// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointments');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// ---------------------
// Middleware: Verify Token
// ---------------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn('⚠️ No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.warn('🚫 Invalid or expired token');
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded; // contains { id, role }
    console.log('✅ Token verified. User:', decoded);
    next();
  });
};

// ---------------------
// Book Appointment (STUDENT)
// ---------------------
router.post('/book-appointment', verifyToken, async (req, res) => {
  try {
    const { professionalId } = req.body;

    if (req.user.role !== 'student') {
      console.warn('🚫 Only students can book appointments');
      return res.status(403).json({ message: 'Only students can book appointments' });
    }

    if (!professionalId) {
      return res.status(400).json({ message: 'Professional ID required' });
    }

    const proObjId = new mongoose.Types.ObjectId(professionalId);

    // Prevent duplicate pending bookings
    const existing = await Appointment.findOne({
      studentId: req.user.id,
      professionalId: proObjId,
      status: 'pending',
    });

    if (existing) {
      return res.status(400).json({ message: 'You already booked this professional and it’s pending' });
    }

    const appointment = new Appointment({
      studentId: req.user.id,
      professionalId: proObjId,
      status: 'pending',
    });

    await appointment.save();
    console.log('📅 Appointment booked successfully:', appointment);

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    console.error('💥 Error booking appointment:', err);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

// ---------------------
// Get Appointments (STUDENT)
// ---------------------
router.get('/student', verifyToken, async (req, res) => {
  try {
    console.log('📩 Fetching student appointments for user:', req.user);

    if (req.user.role !== 'student') {
      console.warn('🚫 Forbidden: User is not a student');
      return res.status(403).json({ message: 'Forbidden' });
    }

    const studentId = req.user.id;
    console.log('🎓 Fetching appointments for student ID:', studentId);

    const appointments = await Appointment.find({ studentId })
      .populate('professionalId', 'fullName profilePic description')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${appointments.length} appointments for student ${studentId}`);
    res.json(appointments);
  } catch (err) {
    console.error('💥 Error fetching student appointments:', err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// ---------------------
// Get Appointments (PROFESSIONAL)
// ---------------------
router.get('/professional', verifyToken, async (req, res) => {
  try {
    console.log('📩 Fetching professional appointments for user:', req.user);

    if (req.user.role !== 'professional') {
      console.warn('🚫 Forbidden: User is not a professional');
      return res.status(403).json({ message: 'Only professionals can access this' });
    }

    const proId = new mongoose.Types.ObjectId(req.user.id);

    const appointments = await Appointment.find({ professionalId: proId })
      .populate('studentId', 'fullName email profilePic')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${appointments.length} appointments for professional ${req.user.id}`);
    res.json(appointments);
  } catch (err) {
    console.error('💥 Error fetching professional appointments:', err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// ---------------------
// Update Appointment Status (PROFESSIONAL)
// ---------------------
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'professional') {
      console.warn('🚫 Forbidden: User is not a professional');
      return res.status(403).json({ message: 'Only professionals can update appointment status' });
    }

    const { id } = req.params;
    const { status } = req.body; // "approved" or "declined"

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Ensure only the professional who owns the appointment can update it
    if (appointment.professionalId.toString() !== req.user.id) {
      console.warn('🚫 Unauthorized update attempt.');
      return res.status(403).json({ message: 'You are not authorized to update this appointment' });
    }

    appointment.status = status;
    await appointment.save();

    const updatedAppointment = await Appointment.findById(id)
      .populate('studentId', 'fullName email profilePic')
      .populate('professionalId', 'fullName description profilePic');

    console.log(`✅ Appointment ${id} status updated to ${status}`);
    res.json({ message: `Appointment ${status}`, appointment: updatedAppointment });
  } catch (err) {
    console.error('💥 Error updating appointment status:', err);
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

// ---------------------
// Get All Appointments (ADMIN / Testing)
// ---------------------
router.get('/', async (req, res) => {
  try {
    const allAppointments = await Appointment.find()
      .populate('studentId', 'fullName email profilePic')
      .populate('professionalId', 'fullName description profilePic')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${allAppointments.length} total appointments`);
    res.json(allAppointments);
  } catch (err) {
    console.error('💥 Error fetching all appointments:', err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

module.exports = router;
