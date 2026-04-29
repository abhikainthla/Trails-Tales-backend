import cloudinary from "./cloudinary.js";

export const uploadImage = async (file) => {
  const res = await cloudinary.uploader.upload(file);
  return res.secure_url;
};
