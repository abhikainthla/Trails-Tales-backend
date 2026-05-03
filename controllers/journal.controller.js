import Journal from "../models/Journal.js";
import { uploadImage } from "../utils/cloudinaryUpload.js";
import fs from "fs";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

//  CREATE
export const createJournal = async (req, res) => {
  try {
    const { title, story, location, lat, lng, date, tags, visibility } = req.body;

    if (!title || !story) {
      return res.status(400).json({ message: "Title and story are required" });
    }

    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadImage(file.path);
          imageUrls.push(url);

          fs.unlinkSync(file.path); // cleanup
        } catch (err) {
          console.error("Image upload failed:", err.message);
        }
      }
    }

    const journal = await Journal.create({
      user: req.user.id,
      title,
      story,
      location: {
        name: location || "",
        type: "Point",
        coordinates:
          lat && lng ? [parseFloat(lng), parseFloat(lat)] : undefined,
      },
      date: date ? new Date(date) : null,
      tags: Array.isArray(tags)
        ? tags
        : tags
        ? tags.split(",").map((t) => t.trim())
        : [],
      visibility: visibility || "public",
      images: imageUrls.length ? imageUrls : [],
    });

    res.status(201).json(journal);
  } catch (err) {
    console.error("CREATE JOURNAL ERROR:", err); // 🔥 LOG THIS
    res.status(500).json({ error: err.message });
  }
};



//  GET ALL (with filters)
export const getJournals = async (req, res) => {
  try {
    const { tag } = req.query;

    const query = {
      visibility: "public",
      ...(tag && { tags: tag }),
    };

    const journals = await Journal.find(query)
      .populate("user", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



//  GET ONE
export const getJournalById = async (req, res) => {
  const journal = await Journal.findById(req.params.id)
    .populate("user", "name avatar")
    .populate("comments.user", "name avatar");

  if (!journal) return res.status(404).json({ message: "Not found" });

  res.json(journal);
};

//  UPDATE (secure)
export const updateJournal = async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  if (!journal) return res.status(404).json({ message: "Not found" });

  if (journal.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  Object.assign(journal, req.body);
  await journal.save();

  res.json(journal);
};

//  DELETE (secure)
export const deleteJournal = async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  if (!journal) return res.status(404).json({ message: "Not found" });

  if (journal.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await journal.deleteOne();

  res.json({ message: "Deleted" });
};

//  GEO SEARCH
export const getNearbyJournals = async (req, res) => {
  const { lng, lat } = req.query;

  const journals = await Journal.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: 10000,
      },
    },
  });

  res.json(journals);
};

//  MEDIA UPLOAD
export const uploadMedia = async (req, res) => {
  try {
    const url = await uploadImage(req.file.path);
    
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  LIKE
export const toggleLike = async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  const liked = journal.likes.includes(req.user.id);
  const owner = await User.findById(journal.user);

  if (liked) {
    journal.likes.pull(req.user.id);
  } else {
    journal.likes.push(req.user.id);

    const io = req.app.get("io");
    io.to(journal.user.toString()).emit("notification", {
      type: "like",
      message: "Someone liked your journal",
    });
  }
if (!liked) {
  await Notification.create({
    user: owner._id,
    type: "like",
    message: `${req.user.name} liked your journal`,
  });

  const io = req.app.get("io");
  io.to(owner._id.toString()).emit("notification", {
    type: "like",
    message: `${req.user.name} liked your journal`,
  });
}

  await journal.save();
  res.json(journal);
};

//  COMMENT
export const addComment = async (req, res) => {
  const journal = await Journal.findById(req.params.id);
  const owner = await User.findById(journal.user);

  const comment = {
    user: req.user.id,
    text: req.body.text,
  };

  journal.comments.push(comment);
  await journal.save();

  const io = req.app.get("io");
  io.to(journal.user.toString()).emit("notification", {
    type: "comment",
    message: "New comment on your journal",
  });

  await Notification.create({
  user: owner._id,
  type: "comment",
  message: `${req.user.name} commented on your journal`,
});


  res.json(journal);
};

//  SEARCH
export const searchJournals = async (req, res) => {
  const { q, tag } = req.query;

  const journals = await Journal.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { story: { $regex: q, $options: "i" } }, // fixed
    ],
    ...(tag && { tags: tag }),
  });

  res.json(journals);
};


//  VIEWS
export const incrementViews = async (req, res) => {
  const journal = await Journal.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );

  res.json(journal);
};
