import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import app from "./app.js";

dotenv.config();

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
