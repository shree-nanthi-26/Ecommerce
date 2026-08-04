import cloudinary from "../config/cloudinary.js";

function uploadToCloudinary(fileBuffer, folder = "electromart") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await uploadToCloudinary(req.file.buffer);
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } else {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      res.json({
        url: base64,
        publicId: `local-${Date.now()}`,
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function uploadMultipleImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No files uploaded");
    }

    const results = await Promise.all(
      req.files.map(async (file) => {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          const result = await uploadToCloudinary(file.buffer);
          return { url: result.secure_url, publicId: result.public_id };
        } else {
          return {
            url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            publicId: `local-${Date.now()}`,
          };
        }
      })
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
}
