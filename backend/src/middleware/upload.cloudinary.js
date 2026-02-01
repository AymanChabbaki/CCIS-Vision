const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const AppError = require('../utils/AppError');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Cloudinary storage for Vercel, disk storage for local
const isProduction = process.env.NODE_ENV === 'production';

let storage;

if (isProduction) {
  // Cloudinary storage for production (Vercel)
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'ccis-vision/uploads',
      allowed_formats: ['xlsx', 'xls', 'csv'],
      resource_type: 'raw', // Important for non-image files
      public_id: (req, file) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`;
        return uniqueName;
      },
    },
  });
} else {
  // Local disk storage for development
  const fs = require('fs');
  const { v4: uuidv4 } = require('uuid');
  
  const uploadDir = config.upload.dir;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
}

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!config.upload.allowedTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed',
        400
      ),
      false
    );
  }
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
  },
});

module.exports = upload;
