import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import AppError from '../utils/AppError.js';

// Allowed types, keyed by the MIME type detected from the file's bytes -> stored extension.
// The browser-sent type and file name are ignored, so a renamed file can't pass as an image.
// SVG is deliberately excluded: it can carry scripts.
export const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const FILE_TYPES = { ...IMAGE_TYPES, 'image/gif': 'gif', 'application/pdf': 'pdf' };

const MB = 1024 * 1024;

// Accepts one multipart/form-data file in `field`, kept in memory (no temp files on disk).
// On success sets req.file.detectedType (MIME) and req.file.extension.
export const uploadSingle = (field, { maxMB, types }) => {
  const parse = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxMB * MB, files: 1 } }).single(field);

  return (req, res, next) => {
    parse(req, res, async (err) => {
      try {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') throw new AppError(413, `File too large (max ${maxMB} MB)`);
          if (err.code === 'LIMIT_UNEXPECTED_FILE') throw new AppError(400, `Send exactly one file in the "${field}" field`);
          throw new AppError(400, err.message);
        }
        if (err) throw err;
        if (!req.file) {
          throw new AppError(400, `No file uploaded. Send it as multipart/form-data in the "${field}" field`);
        }

        const detected = await fileTypeFromBuffer(req.file.buffer);
        const extension = detected && types[detected.mime];
        if (!extension) {
          throw new AppError(415, `Unsupported file type. Allowed: ${[...new Set(Object.values(types))].join(', ')}`);
        }
        req.file.detectedType = detected.mime;
        req.file.extension = extension;
        next();
      } catch (e) {
        next(e);
      }
    });
  };
};
