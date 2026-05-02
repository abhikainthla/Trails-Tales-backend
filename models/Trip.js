import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    title: { type: String, required: true },
    description: String,

    coverImage: String,

    journals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Journal" }],

    countries: [String],
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);
