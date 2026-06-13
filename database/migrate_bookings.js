const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("users.db");

db.serialize(() => {
    db.run("ALTER TABLE bookings RENAME TO bookings_old");

    db.run(`
        CREATE TABLE bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            carReg TEXT NOT NULL,
            spaceNumber TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            bookingRef TEXT NOT NULL UNIQUE
        )
    `);

    db.run(`
        INSERT INTO bookings (id, userId, carReg, spaceNumber, timestamp, bookingRef)
        SELECT id, userId, carReg, spaceNumber, timestamp, bookingRef
        FROM bookings_old
    `);

    db.run("DROP TABLE bookings_old");
});

db.close();
console.log("Bookings table migrated successfully.");
