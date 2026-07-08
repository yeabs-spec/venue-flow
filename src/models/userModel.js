const { getDb } = require("../config/database");

async function create({ fullName, email, passwordHash, role }) {
  const db = getDb();
  const result = await db.run(
    `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `,
    [fullName, email.toLowerCase(), passwordHash, role]
  );

  return findById(result.lastID);
}

async function findByEmail(email) {
  const db = getDb();
  return db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase());
}

async function findById(id) {
  const db = getDb();
  return db.get("SELECT * FROM users WHERE id = ?", id);
}

module.exports = {
  create,
  findByEmail,
  findById
};
