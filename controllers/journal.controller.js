import Journal from "../models/Journal.js";
import { uploadImage } from "../utils/cloudinaryUpload.js";

//  CREATE
export const createJournal = async (req, res) => {
  try {
    const journal = await Journal.create({
      ...req.body,
      user: req.user.id,
    });

    res.status(201).json(journal);
  } catch (err) {
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

  await journal.save();
  res.json(journal);
};

//  COMMENT
export const addComment = async (req, res) => {
  const journal = await Journal.findById(req.params.id);

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

  res.json(journal);
};

//  SEARCH
export const searchJournals = async (req, res) => {
  const { q, tag } = req.query;

  const journals = await Journal.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
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
