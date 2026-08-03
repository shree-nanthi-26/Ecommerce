import axiosInstance from "../api/axiosInstance";

export async function uploadSingleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axiosInstance.post("/upload/single", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function uploadMultipleImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await axiosInstance.post("/upload/multiple", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
