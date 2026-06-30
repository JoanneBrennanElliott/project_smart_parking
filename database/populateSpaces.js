const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

// Your custom space identifiers
const spacesToInsert = [
    "DISABLED-201",
    "DISABLED-202",
    "DISABLED-203",
    "EV-301",
    "EV-302",
    "EV-303",
    "PRIORITY-401",
    "PRIORITY-402",
    "PRIORITY-403"
];

// Insert SQL
const insertSql = `INSERT INTO spaces (spaceNumber) VALUES (?)`;

// Insert each space
spacesToInsert.forEach((space) => {
    db.run(insertSql, [space], (err) => {
        if (err) {
            console.error(`Error inserting ${space}:`, err);
        } else {
            console.log(`Inserted space: ${space}`);
        }
    });
});

// Close DB after inserts finish
setTimeout(() => {
    db.close();
    console.log("Database closed.");
}, 500);
