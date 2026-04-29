import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getProfile,
  updateProfile,
  getUserById,
  toggleFollow
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

router.get("/:id", getUserById);
router.post("/:id/follow", protect, toggleFollow);

export default router;
