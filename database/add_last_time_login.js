// add_last_time_login.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        return;
    }
    console.log("Connected to users.db");
});

db.serialize(() => {
    console.log("Adding last_time_login column...");

    db.run(
        "ALTER TABLE users ADD COLUMN last_time_login TEXT",
        (err) => {
            if (err) {
                console.error("Error altering table:", err.message);
            } else {
                console.log("Column added successfully.");
            }
        }
    );
});

db.close((err) => {
    if (err) {
        console.error("Error closing database:", err.message);
    } else {
        console.log("Database connection closed.");
    }
});
