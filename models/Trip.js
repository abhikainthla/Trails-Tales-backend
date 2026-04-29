import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  journals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Journal" }],
});

export default mongoose.model("Trip", tripSchema);