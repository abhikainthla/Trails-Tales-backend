import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let finalUsername;

    if (username) {
      const clean = username
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9_]/g, "");

      if (clean.length < 3) {
        return res.status(400).json({
          message: "Username must be at least 3 characters",
        });
      }

      const exists = await User.findOne({ username: clean });
      if (exists) {
        return res.status(400).json({ message: "Username taken" });
      }

      finalUsername = clean;
    } else {
      finalUsername = await generateUsername(name);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username: finalUsername,
      email,
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}


    res.json({
  token,
  user: {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    interests: user.interests,
  },
});

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const generateUsername = async (name) => {
  let base = name.toLowerCase().replace(/\s+/g, "");
  base = base.replace(/[^a-z0-9_]/g, "");

  let username = base;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${base}${counter}`;
    counter++;
  }

  return username;
};

export const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { interests },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
