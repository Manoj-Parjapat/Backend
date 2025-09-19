const express = require('express');
const News = require('../models/News');

const router = express.Router();

// GET /news
router.get('/', async (req,res) => {
  try{
    const list = await News.find().populate('createdBy','name email').sort({ createdAt:-1 });
    res.json(list);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// POST /news  { title, description, imageUrl, videoUrl, createdBy }
router.post('/', async (req,res) => {
  try{
    const { title, description, imageUrl, videoUrl, createdBy } = req.body;
    const n = new News({ title, description, imageUrl, videoUrl, createdBy });
    await n.save();
    res.json({ ok:true, news: n });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;