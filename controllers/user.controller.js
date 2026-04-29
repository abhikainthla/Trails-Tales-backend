import User from "../models/User.js";

//  Get user by ID (public profile)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
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
  const updates = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true }
  ).select("-password");

  res.json(user);
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

  res.json({ message: isFollowing ? "Unfollowed" : "Followed" });
};
