const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

db.run(
    "ALTER TABLE users ADD COLUMN isEV INTEGER DEFAULT 0",
    (err) => {
        if (err) {
            if (err.message.includes("duplicate column")) {
                console.log("Column 'isEV' already exists — skipping.");
            } else {
                console.error("Error adding isEV column:", err.message);
            }
        } else {
            console.log("Column 'isEV' added successfully.");
        }
    }
);

db.close((err) => {
    if (err) {
        console.error("Error closing database:", err.message);
    } else {
        console.log("Database connection closed.");
    }
});

