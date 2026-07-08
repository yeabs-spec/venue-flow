const express = require("express");
const { body } = require("express-validator");

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const roomController = require("../controllers/roomController");

const router = express.Router();

router.get("/", asyncHandler(roomController.listRooms));
router.get("/:id", asyncHandler(roomController.getRoom));

router.post(
  "/",
  authenticate,
  authorize("admin"),
  [
    body("name").trim().isLength({ min: 3, max: 80 }),
    body("location").trim().isLength({ min: 2, max: 120 }),
    body("capacity").isInt({ min: 1, max: 500 }),
    body("description").trim().isLength({ min: 20, max: 600 }),
    body("amenities").trim().isLength({ min: 3, max: 255 }),
    body("imageUrl").trim().isLength({ min: 5, max: 255 }),
    body("status").isIn(["available", "maintenance"])
  ],
  asyncHandler(roomController.createRoom)
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  [
    body("name").trim().isLength({ min: 3, max: 80 }),
    body("location").trim().isLength({ min: 2, max: 120 }),
    body("capacity").isInt({ min: 1, max: 500 }),
    body("description").trim().isLength({ min: 20, max: 600 }),
    body("amenities").trim().isLength({ min: 3, max: 255 }),
    body("imageUrl").trim().isLength({ min: 5, max: 255 }),
    body("status").isIn(["available", "maintenance"])
  ],
  asyncHandler(roomController.updateRoom)
);

router.delete("/:id", authenticate, authorize("admin"), asyncHandler(roomController.deleteRoom));

module.exports = router;
