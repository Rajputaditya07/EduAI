import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_MIMETYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          `File type not allowed. Accepted types: PDF, DOCX, JPEG, PNG`
        ),
        false
      );
    }
  },
});

/**
 * Middleware: accept a single file on field 'file'.
 */
const uploadMiddleware = upload.single("file");

export { uploadMiddleware };
