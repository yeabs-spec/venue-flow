const { validationResult } = require("express-validator");

const Room = require("../models/roomModel");

async function listRooms(_req, res) {
  const rooms = await Room.getAll();
  return res.json({ rooms });
}

async function getRoom(req, res) {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ message: "Room not found." });
  }

  return res.json({ room });
}

async function createRoom(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const room = await Room.create(req.body);
  return res.status(201).json({ message: "Room created successfully.", room });
}

async function updateRoom(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingRoom = await Room.findById(req.params.id);
  if (!existingRoom) {
    return res.status(404).json({ message: "Room not found." });
  }

  const room = await Room.update(req.params.id, req.body);
  return res.json({ message: "Room updated successfully.", room });
}

async function deleteRoom(req, res) {
  const existingRoom = await Room.findById(req.params.id);
  if (!existingRoom) {
    return res.status(404).json({ message: "Room not found." });
  }

  await Room.remove(req.params.id);
  return res.json({ message: "Room deleted successfully." });
}

module.exports = {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom
};
