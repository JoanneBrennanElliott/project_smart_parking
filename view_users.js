// view_users.js
const sqlite3 = require("sqlite3").verbose();

// Path to your database file
const db = new sqlite3.Database("./users.db", sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        return;
    }
    console.log("Connected to users.db");
});

// Query the users table
db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        console.error("Error reading users table:", err.message);
        return;
    }

    console.log("\n=== USERS TABLE ===");
    if (rows.length === 0) {
        console.log("No users found.");
    } else {
        rows.forEach((row) => {
            console.log(row);
        });
    }
    console.log("===================\n");
});

// Close DB
db.close((err) => {
    if (err) {
        console.error("Error closing database:", err.message);
    } else {
        console.log("Database connection closed.");
    }
});
