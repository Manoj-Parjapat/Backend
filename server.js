require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const uploadRoutes = require('./routes/upload');

const app = express();
app.use(cors());
app.use(express.json());

// static serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Root route (यह जोड़ना जरूरी है)
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// routes
app.use('/auth', authRoutes);
app.use('/news', newsRoutes);
app.use('/upload', uploadRoutes);

// mongodb connect
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/aapnoalwar';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
