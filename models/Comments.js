import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  journal: { type: mongoose.Schema.Types.ObjectId, ref: "Journal" },
  text: String,
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);