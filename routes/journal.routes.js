import express from "express";
import {
  createJournal,
  deleteJournal,
  getJournalById,
  getJournals,
  updateJournal,
  getNearbyJournals,
  toggleLike,
  addComment,
  searchJournals,
  incrementViews,
} from "../controllers/journal.controller.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Specific routes first
router.get("/nearby", getNearbyJournals);
router.get("/search", searchJournals);

// CRUD
router.post("/", protect, upload.array("images", 20), createJournal);
router.get("/", getJournals);
router.get("/:id", getJournalById);
router.put("/:id", protect, updateJournal);
router.delete("/:id", protect, deleteJournal);

// Social
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);

// Analytics
router.patch("/:id/view", incrementViews);

export default router;
