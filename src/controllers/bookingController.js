const { validationResult } = require("express-validator");

const Booking = require("../models/bookingModel");
const Room = require("../models/roomModel");

async function listMyBookings(req, res) {
  const bookings = await Booking.getByUserId(req.user.id);
  return res.json({ bookings });
}

async function listAllBookings(_req, res) {
  const bookings = await Booking.getAll();
  return res.json({ bookings });
}

async function getSummary(req, res) {
  const summary = await Booking.getSummary(req.user);
  return res.json({ summary });
}

async function createBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const room = await Room.findById(req.body.roomId);
  if (!room) {
    return res.status(404).json({ message: "Selected room does not exist." });
  }

  if (room.status !== "available") {
    return res.status(400).json({ message: "This room is not currently available for booking." });
  }

  if (req.body.startTime >= req.body.endTime) {
    return res.status(400).json({ message: "End time must be later than start time." });
  }

  const conflict = await Booking.findConflict({
    roomId: req.body.roomId,
    bookingDate: req.body.bookingDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime
  });

  if (conflict) {
    return res.status(409).json({
      message: "That time slot overlaps with an existing booking request for the selected room."
    });
  }

  const booking = await Booking.create({
    userId: req.user.id,
    ...req.body
  });

  return res.status(201).json({
    message: "Booking request submitted successfully.",
    booking
  });
}

async function updateBookingStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  if (booking.status !== "pending") {
    return res.status(400).json({ message: "Only pending bookings can be moderated." });
  }

  const updatedBooking = await Booking.updateStatus(req.params.id, req.body.status, req.body.adminNote || null);
  return res.json({
    message: "Booking status updated successfully.",
    booking: updatedBooking
  });
}

async function cancelBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  const isOwner = booking.user_id === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "You do not have permission to cancel this booking." });
  }

  if (booking.status === "cancelled" || booking.status === "rejected") {
    return res.status(400).json({ message: "This booking can no longer be cancelled." });
  }

  const updatedBooking = await Booking.updateStatus(req.params.id, "cancelled", "Cancelled by user");
  return res.json({
    message: "Booking cancelled successfully.",
    booking: updatedBooking
  });
}

module.exports = {
  listMyBookings,
  listAllBookings,
  getSummary,
  createBooking,
  updateBookingStatus,
  cancelBooking
};
