const express = require('express');
const multer = require('multer');
const path = require('path');
const Upload = require('../models/Upload');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function(req,file,cb){
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function(req,file,cb){
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random()*1E9) + ext);
  }
});
const upload = multer({ storage });

// POST /upload/file  (form-data: file, uploadedBy (optional))
router.post('/file', upload.single('file'), async (req,res) => {
  try{
    const file = req.file;
    if(!file) return res.status(400).json({ error:'No file' });
    const { uploadedBy } = req.body;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    const type = file.mimetype.startsWith('video') ? 'video' : 'image';
    const doc = await Upload.create({ fileUrl, fileType: type, uploadedBy });
    res.json({ ok:true, upload: doc, fileUrl });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// GET /upload
router.get('/', async (req,res) => {
  try{
    const uploads = await Upload.find().populate('uploadedBy','name email').sort({ createdAt:-1 });
    res.json(uploads);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;