import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "./error.middleware";

export const PRODUCT_UPLOADS_DIR = path.join(
  process.cwd(),
  "uploads",
  "products",
);

if (!fs.existsSync(PRODUCT_UPLOADS_DIR)) {
  fs.mkdirSync(PRODUCT_UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRODUCT_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeField = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `amul-${safeField}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per side image
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new AppError(
          400,
          "INVALID_FILE_TYPE",
          "Only JPG, PNG, and WEBP product images are allowed.",
        ),
      );
      return;
    }
    cb(null, true);
  },
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
  { name: "leftImage", maxCount: 1 },
  { name: "rightImage", maxCount: 1 },
]);
