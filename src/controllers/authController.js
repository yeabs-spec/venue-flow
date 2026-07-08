const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const User = require("../models/userModel");
const { signToken } = require("../utils/token");

function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, password } = req.body;
  const existingUser = await User.findByEmail(email);

  if (existingUser) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role: "member"
  });

  const token = signToken(user);

  return res.status(201).json({
    message: "Account created successfully.",
    token,
    user: sanitizeUser(user)
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);

  return res.json({
    message: "Login successful.",
    token,
    user: sanitizeUser(user)
  });
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.id);
  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  register,
  login,
  getCurrentUser
};
