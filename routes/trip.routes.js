import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import {
  createTrip,
  getUserTrips,
  getTripById,
  addJournalToTrip,
  deleteTrip,
} from "../controllers/trip.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// IMPORTANT: order matters
router.post("/", protect, upload.single("cover"), createTrip);
router.get("/", protect, getUserTrips);
router.get("/:id", getTripById);
router.post("/:id/journal", protect, addJournalToTrip);
router.delete("/:id", protect, deleteTrip);

export default router;
