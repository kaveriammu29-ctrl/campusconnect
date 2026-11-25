
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
  try {
    const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

    if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
      throw new Error("Set MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in .env");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must contain at least 8 characters");
    }

    await mongoose.connect(MONGO_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role !== "admin") {
        throw new Error("That email already belongs to a student account. Choose another admin email.");
      }

      console.log("This admin account already exists.");
      return;
    }

    const password = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      fullName: ADMIN_NAME.trim(),
      email,
      password,
      role: "admin"
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
