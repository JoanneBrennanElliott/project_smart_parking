const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("users.db");

db.serialize(() => {
    db.run(`
		    CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // Default accounts
    const users = [
        { username: "admin", password: "1234" },
        { username: "joanne", password: "pass123" },
        { username: "aa", password: "aa" },
        { username: "zz", password: "zz" }
    ];

    users.forEach(u => {
        db.run(
            `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
            [u.username, u.password]
        );
    });


db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            carReg TEXT NOT NULL,
            spaceNumber INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            bookingRef TEXT NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) {
            console.error("Error creating bookings table:", err.message);
        } else {
            console.log("Bookings table created (or already exists).");
        }
    });
});

db.close();


/*           CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT    ) `);
    // Insert default admin user
    db.run(`
        INSERT OR IGNORE INTO users (username, password)
        VALUES ('admin', '1234')`);
*/