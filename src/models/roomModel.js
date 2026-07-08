const { getDb } = require("../config/database");

async function getAll() {
  const db = getDb();
  return db.all(`
    SELECT *
    FROM rooms
    ORDER BY CASE status WHEN 'available' THEN 0 ELSE 1 END, name ASC
  `);
}

async function findById(id) {
  const db = getDb();
  return db.get("SELECT * FROM rooms WHERE id = ?", id);
}

async function create({ name, location, capacity, description, amenities, imageUrl, status }) {
  const db = getDb();
  const result = await db.run(
    `
      INSERT INTO rooms (name, location, capacity, description, amenities, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [name, location, capacity, description, amenities, imageUrl, status]
  );

  return findById(result.lastID);
}

async function update(id, { name, location, capacity, description, amenities, imageUrl, status }) {
  const db = getDb();
  await db.run(
    `
      UPDATE rooms
      SET name = ?, location = ?, capacity = ?, description = ?, amenities = ?, image_url = ?, status = ?
      WHERE id = ?
    `,
    [name, location, capacity, description, amenities, imageUrl, status, id]
  );

  return findById(id);
}

async function remove(id) {
  const db = getDb();
  return db.run("DELETE FROM rooms WHERE id = ?", id);
}

module.exports = {
  getAll,
  findById,
  create,
  update,
  remove
};
