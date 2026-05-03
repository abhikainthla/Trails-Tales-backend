import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"],
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: { type: String, required: true },

    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },

    interests: {
      type: [String],
      default: [],
      set: (arr) =>
        arr.map((i) => i.trim().toLowerCase()),
    },

    isProfileComplete: { type: Boolean, default: false },

    isVerified: { type: Boolean, default: false },

    tier: {
      type: String,
      enum: ["Explorer", "Pro", "Creator"],
      default: "Explorer",
    },

    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
  },
  { timestamps: true }
);

//  ensure username always sanitized
userSchema.pre("save", function (next) {
  if (this.username) {
    this.username = this.username
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "");
  }
  next();
});

export default mongoose.model("User", userSchema);
