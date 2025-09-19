const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'verysecretkey';

// optional email transporter if SMTP configured
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Register
router.post('/register', async (req,res) => {
  try{
    const { name, email, phone, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashed });
    await user.save();
    res.json({ ok:true, user });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Login (email or phone)
router.post('/login', async (req,res) => {
  try{
    const { identifier, password } = req.body; // identifier = email or phone
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }]});
    if(!user) return res.status(400).json({ error:'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ error:'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn:'30d' });
    res.json({ token, user });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// send OTP (email or phone) — returns OTP in response if SMTP not configured (for testing)
router.post('/send-otp', async (req,res) => {
  try{
    const { phoneOrEmail } = req.body;
    const otp = Math.floor(100000 + Math.random()*900000).toString();
    const expiresAt = new Date(Date.now() + 10*60*1000); // 10 min
    await Otp.create({ phoneOrEmail, otp, expiresAt });

    if (transporter && phoneOrEmail.includes('@')) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: phoneOrEmail,
        subject: 'AAPNO ALWAR OTP',
        text: `Your OTP: ${otp}`
      });
      return res.json({ ok:true, message:'OTP sent to email' });
    }
    // For SMS integrate Twilio / provider. For quick testing, return OTP:
    res.json({ ok:true, otp, message:'OTP returned in response (testing mode)' });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// verify otp
router.post('/verify-otp', async (req,res) => {
  try{
    const { phoneOrEmail, otp } = req.body;
    const rec = await Otp.findOne({ phoneOrEmail, otp }).sort({ createdAt:-1 });
    if(!rec) return res.status(400).json({ error:'Invalid OTP' });
    if(rec.expiresAt < new Date()) return res.status(400).json({ error:'OTP expired' });
    res.json({ ok:true, message:'OTP verified' });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// reset password using otp
router.post('/reset-password', async (req,res) => {
  try{
    const { phoneOrEmail, otp, newPassword } = req.body;
    const rec = await Otp.findOne({ phoneOrEmail, otp }).sort({ createdAt:-1 });
    if(!rec || rec.expiresAt < new Date()) return res.status(400).json({ error:'Invalid or expired OTP' });
    const user = await User.findOne({ $or: [{ email: phoneOrEmail }, { phone: phoneOrEmail }]});
    if(!user) return res.status(400).json({ error:'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok:true, message:'Password reset' });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;