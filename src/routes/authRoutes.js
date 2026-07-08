const express = require("express");
const { body } = require("express-validator");

const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("fullName").trim().isLength({ min: 3, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[a-z]/)
      .matches(/[0-9]/)
  ],
  asyncHandler(authController.register)
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  asyncHandler(authController.login)
);

router.get("/me", authenticate, asyncHandler(authController.getCurrentUser));

module.exports = router;
