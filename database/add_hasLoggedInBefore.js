// add_hasLoggedInBefore.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        return;
    }
    console.log("Connected to users.db");
});

db.serialize(() => {
    console.log("Adding hasLoggedInBefore column...");

    db.run(
        "ALTER TABLE users ADD COLUMN hasLoggedInBefore INTEGER DEFAULT 0",
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
