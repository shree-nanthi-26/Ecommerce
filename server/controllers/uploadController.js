export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    res.json({
      url: req.file.path,
      publicId: req.file.filename,
    });
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

    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    res.json(images);
  } catch (error) {
    next(error);
  }
}
