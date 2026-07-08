const express = require("express");
const { body } = require("express-validator");

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

router.get("/my", authenticate, asyncHandler(bookingController.listMyBookings));
router.get("/summary", authenticate, asyncHandler(bookingController.getSummary));
router.get("/", authenticate, authorize("admin"), asyncHandler(bookingController.listAllBookings));

router.post(
  "/",
  authenticate,
  [
    body("roomId").isInt({ min: 1 }),
    body("title").trim().isLength({ min: 3, max: 100 }),
    body("bookingDate").isISO8601(),
    body("startTime").matches(/^\d{2}:\d{2}$/),
    body("endTime").matches(/^\d{2}:\d{2}$/),
    body("attendees").isInt({ min: 1, max: 500 }),
    body("purpose").trim().isLength({ min: 10, max: 500 })
  ],
  asyncHandler(bookingController.createBooking)
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  [body("status").isIn(["approved", "rejected"]), body("adminNote").optional().isLength({ max: 255 })],
  asyncHandler(bookingController.updateBookingStatus)
);

router.patch("/:id/cancel", authenticate, asyncHandler(bookingController.cancelBooking));

module.exports = router;
