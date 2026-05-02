import Trip from "../models/Trip.js";
import Journal from "../models/Journal.js";
import { uploadImage } from "../utils/cloudinaryUpload.js";
import fs from "fs";

//  CREATE TRIP
export const createTrip = async (req, res) => {
  try {
    const { title, description } = req.body;

    let coverImage = "";

    if (req.file) {
      coverImage = await uploadImage(req.file.path);
      fs.unlinkSync(req.file.path);
    }

    const trip = await Trip.create({
      user: req.user.id,
      title,
      description,
      coverImage,
    });

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  GET USER TRIPS
export const getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id })
      .populate({
        path: "journals",
        select: "title location images date",
      })
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  GET SINGLE TRIP
export const getTripById = async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate({
      path: "journals",
      populate: { path: "user", select: "name avatar" },
    });

  if (!trip) return res.status(404).json({ message: "Trip not found" });

  res.json(trip);
};

//  ADD JOURNAL TO TRIP
export const addJournalToTrip = async (req, res) => {
  const { journalId } = req.body;

  if (!journalId) {
    return res.status(400).json({ message: "Journal ID required" });
  }

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (trip.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // prevent duplicates
  if (!trip.journals.includes(journalId)) {
    trip.journals.push(journalId);
  }

  await trip.save();

  const updated = await Trip.findById(trip._id).populate("journals");

  res.json(updated);
};


//  DELETE TRIP
export const deleteTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) return res.status(404).json({ message: "Not found" });

  if (trip.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await trip.deleteOne();

  res.json({ message: "Trip deleted" });
};
