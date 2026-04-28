import express from "express";
import { createJournal, getJournals } from "../controllers/journal.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createJournal);
router.get("/", getJournals);

export default router;
