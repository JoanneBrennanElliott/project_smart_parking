const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

const createTableSql = `
CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spaceNumber TEXT NOT NULL,
    isBooked INTEGER DEFAULT 0,
    userId TEXT,
    carReg TEXT
);
`;

db.run(createTableSql, (err) => {
    if (err) {
        console.error("Error creating spaces table:", err);
    } else {
        console.log("spaces table is ready.");
    }
    db.close();
});
