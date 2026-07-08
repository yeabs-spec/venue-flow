const { getDb } = require("../config/database");

const bookingSelect = `
  SELECT
    bookings.*,
    users.full_name AS requester_name,
    users.email AS requester_email,
    rooms.name AS room_name,
    rooms.location AS room_location
  FROM bookings
  INNER JOIN users ON users.id = bookings.user_id
  INNER JOIN rooms ON rooms.id = bookings.room_id
`;

async function create({ userId, roomId, title, bookingDate, startTime, endTime, attendees, purpose }) {
  const db = getDb();
  const result = await db.run(
    `
      INSERT INTO bookings (
        user_id, room_id, title, booking_date, start_time, end_time, attendees, purpose, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
    [userId, roomId, title, bookingDate, startTime, endTime, attendees, purpose]
  );

  return findById(result.lastID);
}

async function findById(id) {
  const db = getDb();
  return db.get(`${bookingSelect} WHERE bookings.id = ?`, id);
}

async function getByUserId(userId) {
  const db = getDb();
  return db.all(`${bookingSelect} WHERE bookings.user_id = ? ORDER BY bookings.booking_date DESC, bookings.start_time ASC`, userId);
}

async function getAll() {
  const db = getDb();
  return db.all(`${bookingSelect} ORDER BY bookings.booking_date DESC, bookings.start_time ASC`);
}

async function findConflict({ roomId, bookingDate, startTime, endTime }) {
  const db = getDb();
  return db.get(
    `
      SELECT id
      FROM bookings
      WHERE room_id = ?
        AND booking_date = ?
        AND status IN ('pending', 'approved')
        AND (? < end_time AND ? > start_time)
      LIMIT 1
    `,
    [roomId, bookingDate, startTime, endTime]
  );
}

async function updateStatus(id, status, adminNote) {
  const db = getDb();
  await db.run(
    `
      UPDATE bookings
      SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [status, adminNote, id]
  );

  return findById(id);
}

async function getSummary(user) {
  const db = getDb();
  const availableRoomsRow = await db.get(
    "SELECT COUNT(*) AS count FROM rooms WHERE status = 'available'"
  );

  if (user.role === "admin") {
    const [pendingRow, totalBookingsRow, membersRow] = await Promise.all([
      db.get("SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"),
      db.get("SELECT COUNT(*) AS count FROM bookings"),
      db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'member'")
    ]);

    return {
      availableRooms: availableRoomsRow.count,
      pendingBookings: pendingRow.count,
      totalBookings: totalBookingsRow.count,
      activeMembers: membersRow.count
    };
  }

  const [myPendingRow, myApprovedRow] = await Promise.all([
    db.get("SELECT COUNT(*) AS count FROM bookings WHERE user_id = ? AND status = 'pending'", user.id),
    db.get("SELECT COUNT(*) AS count FROM bookings WHERE user_id = ? AND status = 'approved'", user.id)
  ]);

  return {
    availableRooms: availableRoomsRow.count,
    myPendingBookings: myPendingRow.count,
    myApprovedBookings: myApprovedRow.count
  };
}

module.exports = {
  create,
  findById,
  getByUserId,
  getAll,
  findConflict,
  updateStatus,
  getSummary
};
