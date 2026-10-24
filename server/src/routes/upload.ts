import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

export const uploadRouter = Router();

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowed.test(ext) && (mime.startsWith('image/') || mime === 'image/svg+xml')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP, SVG) up to 5MB are permitted.'));
    }
  }
});

// Admin upload single image
uploadRouter.post('/', authenticateToken, requireAdmin, upload.single('image'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded.' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'File upload failed.' });
  }
});

// Admin upload multiple images
uploadRouter.post('/multiple', authenticateToken, requireAdmin, upload.array('images', 8), (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No images uploaded.' });
      return;
    }

    const uploaded = files.map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size
    }));

    res.json({ files: uploaded });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Multiple upload failed.' });
  }
});
