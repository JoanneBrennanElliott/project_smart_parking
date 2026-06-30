const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db");

db.serialize(() => {
    db.run(
        "ALTER TABLE users ADD COLUMN email TEXT",
        (err) => {
            if (err) {
                if (err.message.includes("duplicate column name")) {
                    console.log("email column already exists");
                } else {
                    console.error("Migration error:", err.message);
                }
            } else {
                console.log("email column added successfully");
            }
        }
    );
});

db.close();
