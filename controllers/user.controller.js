import User from "../models/User.js";
import Journal from "../models/Journal.js";
import Trip from "../models/Trip.js";
import { uploadImage } from "../utils/cloudinaryUpload.js";
import fs from "fs";

//  Get user by ID (public profile)
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.params.id || req.params.id === "undefined") {
      return res.status(400).json({ message: "Invalid user id" });
    }


    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    //  fetch journals
    const journals = await Journal.find({
      user: userId,
      visibility: "public",
    }).sort({ createdAt: -1 });

    //  fetch trips
    const trips = await Trip.find({ user: userId })
      .populate("journals")
      .sort({ createdAt: -1 });

    //  stats
    const stats = {
      trips: trips.length,
      places: new Set(
        journals.map((j) => j.location?.name).filter(Boolean)
      ).size,
      followers: user.followers.length,
      following: user.following.length,
    };

    res.json({
      user,
      journals,
      trips,
      stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 👤 Get logged-in user
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password")
    .populate("followers following", "name avatar");

  res.json(user);
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    let avatarUrl = req.body.avatar;

    // 🔥 handle avatar upload
    if (req.file) {
      avatarUrl = await uploadImage(req.file.path);
      fs.unlinkSync(req.file.path);
    }

    const updates = {
      ...req.body,
      avatar: avatarUrl,
      isProfileComplete: true,
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Follow / Unfollow
export const toggleFollow = async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;

  const user = await User.findById(userId);
  const target = await User.findById(targetId);

  if (!target) return res.status(404).json({ message: "User not found" });

const isFollowing = user.following.includes(targetId);



  if (isFollowing) {
    user.following.pull(targetId);
    target.followers.pull(userId);
  } else {
    user.following.push(targetId);
    target.followers.push(userId);
  }
  target.notifications.push({
  type: "follow",
  message: `${user.name} followed you`,
})

  await user.save();
  await target.save();

  //  SOCKET NOTIFICATION
  const io = req.app.get("io");
  if (!isFollowing) {
    io.to(targetId).emit("notification", {
      type: "follow",
      message: `${user.name} followed you`,
    });
  }

res.json({
  message: isFollowing ? "Unfollowed" : "Followed",
  isFollowing,
});


};
