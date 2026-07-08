const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const { logger } = require("./logger");

let dbInstance;

const sampleRooms = [
  {
    aliases: ["Atlas Boardroom", "Innovation Lab"],
    name: "Atlas Boardroom",
    location: "Block A",
    capacity: 18,
    description:
      "A polished executive room for leadership reviews, client presentations, and strategy sessions. It has generous daylight, acoustic treatment, and presentation-ready AV.",
    amenities: "Projector, Whiteboard, High-speed Wi-Fi, HDMI, Video Conferencing",
    imageUrl: "/assets/rooms/atlas-boardroom.svg",
    status: "available"
  },
  {
    aliases: ["Huddle Room North", "Executive Boardroom"],
    name: "Huddle Room North",
    location: "Block C",
    capacity: 8,
    description:
      "A compact collaboration room designed for focused team standups, sprint planning, and design reviews. Best suited for fast-moving working sessions.",
    amenities: "TV Screen, Speakerphone, Video Conferencing, Whiteboard",
    imageUrl: "/assets/rooms/huddle-room-north.svg",
    status: "available"
  },
  {
    aliases: ["Strategy Suite", "Makers Studio"],
    name: "Strategy Suite",
    location: "Administration Wing",
    capacity: 14,
    description:
      "A premium board-style space for quarterly planning, partner meetings, and executive workshops. Currently rotated into maintenance for setup updates.",
    amenities: "Conference Display, Whiteboard Wall, Presentation Console",
    imageUrl: "/assets/rooms/strategy-suite.svg",
    status: "maintenance"
  }
];

async function ensureRoomColumns(db) {
  const columns = await db.all("PRAGMA table_info(rooms)");
  const columnNames = columns.map((column) => column.name);

  if (!columnNames.includes("description")) {
    await db.exec("ALTER TABLE rooms ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  }

  if (!columnNames.includes("image_url")) {
    await db.exec("ALTER TABLE rooms ADD COLUMN image_url TEXT NOT NULL DEFAULT ''");
  }
}

async function syncSeedRoomMetadata(db) {
  for (const room of sampleRooms) {
    for (const alias of room.aliases) {
      await db.run(
        `
          UPDATE rooms
          SET
            name = ?,
            location = ?,
            capacity = ?,
            description = ?,
            amenities = ?,
            image_url = ?,
            status = ?
          WHERE name = ?
        `,
        [
          room.name,
          room.location,
          room.capacity,
          room.description,
          room.amenities,
          room.imageUrl,
          room.status,
          alias
        ]
      );
    }
  }
}

async function seedInitialData(db) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@venueflow.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const existingAdmin = await db.get("SELECT id FROM users WHERE email = ?", adminEmail);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.run(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `,
      ["System Administrator", adminEmail, passwordHash, "admin"]
    );
    logger.info("Seeded default administrator account", { email: adminEmail });
  }

  const roomCount = await db.get("SELECT COUNT(*) AS count FROM rooms");

  if (roomCount.count === 0) {
    for (const room of sampleRooms) {
      await db.run(
        `
          INSERT INTO rooms (name, location, capacity, description, amenities, image_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          room.name,
          room.location,
          room.capacity,
          room.description,
          room.amenities,
          room.imageUrl,
          room.status
        ]
      );
    }

    logger.info("Seeded sample rooms");
  } else {
    await syncSeedRoomMetadata(db);
  }
}

async function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDirectory = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  dbInstance = await open({
    filename: path.join(dataDirectory, "venueflow.db"),
    driver: sqlite3.Database
  });

  await dbInstance.exec("PRAGMA foreign_keys = ON;");

  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await dbInstance.exec(schemaSql);
  await ensureRoomColumns(dbInstance);
  await seedInitialData(dbInstance);

  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    throw new Error("Database has not been initialized yet.");
  }

  return dbInstance;
}

module.exports = {
  initializeDatabase,
  getDb
};
