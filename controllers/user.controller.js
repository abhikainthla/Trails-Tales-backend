import User from "../models/User.js";
import Journal from "../models/Journal.js";
import Trip from "../models/Trip.js";
import { uploadImage } from "../utils/cloudinaryUpload.js";
import fs from "fs";

//  Get user by ID (public profile)
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || userId === "undefined") {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const currentUser = req.user
      ? await User.findById(req.user.id)
      : null;

    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    const journals = await Journal.find({
      user: userId,
      visibility: "public",
    }).sort({ createdAt: -1 });

    const trips = await Trip.find({ user: userId })
      .populate("journals")
      .sort({ createdAt: -1 });

    const stats = {
      trips: trips.length,
      places: new Set(
        journals.map((j) => j.location?.name).filter(Boolean)
      ).size,
      followers: user.followers.length,
      following: user.following.length,
    };

    const isFollowing = currentUser
      ? currentUser.following.includes(userId)
      : false;

    res.json({
      user,
      journals,
      trips,
      stats,
      isFollowing,
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



if (!isFollowing) {
  await Notification.create({
    user: targetId,
    type: "follow",
    message: `${user.name} followed you`,
  });

  const io = req.app.get("io");
  io.to(targetId).emit("notification", {
    type: "follow",
    message: `${user.name} followed you`,
  });
}


  await user.save();

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

//  GET ALL TRAVELERS
export const getTravelers = async (req, res) => {
  try {
    let { search = "", page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const currentUser = req.user
      ? await User.findById(req.user.id)
      : null;

    const followingIds = currentUser?.following || [];

    const users = await User.aggregate([
      {
        $match: {
          isProfileComplete: true,
          ...(search && {
            name: { $regex: search, $options: "i" },
          }),
        },
      },

      {
        $lookup: {
          from: "journals",
          localField: "_id",
          foreignField: "user",
          as: "journals",
        },
      },

      {
        $addFields: {
          journals: {
            $filter: {
              input: "$journals",
              as: "j",
              cond: { $eq: ["$$j.visibility", "public"] },
            },
          },
        },
      },

      {
        $addFields: {
          recentJournals: {
            $filter: {
              input: "$journals",
              as: "j",
              cond: {
                $gte: [
                  "$$j.createdAt",
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
            },
          },
        },
      },

      {
        $addFields: {
          totalLikes: {
            $sum: {
              $map: {
                input: "$journals",
                as: "j",
                in: { $size: "$$j.likes" },
              },
            },
          },
          recentLikes: {
            $sum: {
              $map: {
                input: "$recentJournals",
                as: "j",
                in: { $size: "$$j.likes" },
              },
            },
          },
          followersCount: { $size: "$followers" },
          totalPosts: { $size: "$journals" },

          previewImages: {
            $slice: [
              {
                $map: {
                  input: "$journals",
                  as: "j",
                  in: { $arrayElemAt: ["$$j.images", 0] },
                },
              },
              2,
            ],
          },
        },
      },

      {
        $addFields: {
          interestScore: currentUser
            ? {
                $size: {
                  $setIntersection: [
                    "$interests",
                    currentUser.interests || [],
                  ],
                },
              }
            : 0,
        },
      },

      {
        $addFields: {
          score: {
            $add: [
              "$followersCount",
              { $multiply: ["$totalLikes", 2] },
              { $multiply: ["$recentLikes", 3] },
              { $multiply: ["$interestScore", 10] },
            ],
          },
        },
      },

      { $sort: { score: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          name: 1,
          username: 1,
          avatar: 1,
          bio: 1,
          location: 1,
          interests: 1,
          followersCount: 1,
          totalPosts: 1,
          previewImages: 1,
          isVerified: 1,
          tier: 1,

          isFollowing: {
            $in: ["$_id", followingIds],
          },
        },
      }
    ]);

    res.json(users);
  } catch (err) {
    console.error("GET TRAVELERS ERROR:", err); // 👈 IMPORTANT
    res.status(500).json({ error: err.message });
  }
};



export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id },
          isProfileComplete: true,
        },
      },

      {
        $addFields: {
          interestScore: {
            $size: {
              $setIntersection: [
                "$interests",
                currentUser.interests || [],
              ],
            },
          },
        },
      },

      {
        $sort: { interestScore: -1 },
      },

      { $limit: 10 },

      {
        $project: {
          name: 1,
          username: 1,
          avatar: 1,
          interests: 1,
        },
      },
    ]);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



