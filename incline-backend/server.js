// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/ChatRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');


const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// connect to DB
connectDB();

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/protected'));
app.use('/api/user', userRoutes)
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
