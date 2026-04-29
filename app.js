import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import journalRoutes from "./routes/journal.routes.js";
import userRoutes from "./routes/user.routes.js";




const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/users", userRoutes);
// health check
app.get("/", (req, res) => {
  res.send("API is running...");
});


export default app;
