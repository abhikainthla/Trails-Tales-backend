import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true },

    story: { type: String, required: true },


    location: {
      name: String,
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
    },


    date: {
      type: Date,
    },

    images: [String],

    tags: [String],

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    views: { type: Number, default: 0 },

    visibility: {
      type: String,
      enum: ["public", "private", "followers"], // ✅ added
      default: "public",
    },
  },
  { timestamps: true }
);
journalSchema.index({ location: "2dsphere" });


export default mongoose.model("Journal", journalSchema);
