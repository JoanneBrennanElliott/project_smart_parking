const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        return;
    }
    console.log("Connected to users.db");
});

db.serialize(() => {
    console.log("Adding permitNumber column...");

    db.run(
        "ALTER TABLE users ADD COLUMN permitNumber TEXT",
        (err) => {
            if (err) {
                if (err.message.includes("duplicate column name")) {
                    console.log("Column already exists — nothing to do.");
                } else {
                    console.error("Error altering table:", err.message);
                }
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
