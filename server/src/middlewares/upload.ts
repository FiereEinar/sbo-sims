import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Use memory storage if we are on Vercel or production where local filesystem is read-only
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const storage = isProduction
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(
          null,
          file.fieldname +
            '-' +
            uniqueSuffix +
            path.extname(file.originalname),
        );
      },
    });

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
