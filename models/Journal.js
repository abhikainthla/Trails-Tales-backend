import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    location: {
      name: String,
      coordinates: [Number],
    },
    images: [String],
    tags: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Journal", journalSchema);
