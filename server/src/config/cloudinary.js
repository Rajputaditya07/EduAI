import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer}  buffer   - File buffer (from multer memoryStorage)
 * @param {string}  mimetype - e.g. 'application/pdf', 'image/png'
 * @param {string}  folder   - Cloudinary folder, e.g. 'eduai/submissions'
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (buffer, mimetype, folder = "eduai/submissions") => {
  const resourceType = mimetype.startsWith("image/") ? "image" : "raw";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Pipe the buffer into the upload stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

export { cloudinary, uploadToCloudinary };
