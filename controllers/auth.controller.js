import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// =====================================================
// HELPERS
// =====================================================

const generateUsername = async (name) => {
  let base = String(name || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");

  if (!base) {
    base = "traveler";
  }

  // Usernames must be at least 3 characters
  if (base.length < 3) {
    base = `${base}traveler`;
  }

  // Respect schema max length
  base = base.substring(0, 20);

  let username = base;
  let counter = 1;

  while (await User.findOne({ username })) {
    const suffix = String(counter);
    const maxBaseLength = 20 - suffix.length;

    username = `${base.substring(0, maxBaseLength)}${suffix}`;
    counter++;
  }

  return username;
};

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  location: user.location,
  interests: user.interests,
  isProfileComplete: user.isProfileComplete,
  isVerified: user.isVerified,
  tier: user.tier,
  followers: user.followers,
  following: user.following,
  createdAt: user.createdAt,
});

// =====================================================
// REGISTER
// =====================================================

export const register = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      username,
    } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    name = name?.trim();
    email = email?.trim().toLowerCase();
    username = username?.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters",
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        message: "Name cannot exceed 50 characters",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        message: "Password cannot exceed 72 characters",
      });
    }

    // -----------------------------
    // Check email
    // -----------------------------

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // -----------------------------
    // Username
    // -----------------------------

    let finalUsername;

    if (username) {
      const cleanUsername = username
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9_]/g, "");

      if (cleanUsername.length < 3) {
        return res.status(400).json({
          message: "Username must be at least 3 characters",
        });
      }

      if (cleanUsername.length > 20) {
        return res.status(400).json({
          message: "Username cannot exceed 20 characters",
        });
      }

      const exists = await User.findOne({
        username: cleanUsername,
      });

      if (exists) {
        return res.status(409).json({
          message: "Username is already taken",
        });
      }

      finalUsername = cleanUsername;
    } else {
      finalUsername = await generateUsername(name);
    }

    // -----------------------------
    // Hash password
    // -----------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // -----------------------------
    // Create user
    // -----------------------------

    const user = await User.create({
      name,
      username: finalUsername,
      email,
      password: hashedPassword,
    });

    // -----------------------------
    // Create token
    // -----------------------------

    const token = createToken(user._id);

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    // Mongo duplicate key
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];

      return res.status(409).json({
        message:
          duplicateField === "email"
            ? "Email already exists"
            : "Username already exists",
      });
    }

    return res.status(500).json({
      message: "Unable to create account",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        message: "Authentication service is not configured",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Unable to login",
    });
  }
};

// =====================================================
// UPDATE INTERESTS
// =====================================================

export const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        message: "Interests must be an array",
      });
    }

    const cleanedInterests = interests
      .map((interest) =>
        String(interest).trim().toLowerCase()
      )
      .filter(Boolean);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        interests: cleanedInterests,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);
  } catch (err) {
    console.error("UPDATE INTERESTS ERROR:", err);

    return res.status(500).json({
      message: "Unable to update interests",
    });
  }
};