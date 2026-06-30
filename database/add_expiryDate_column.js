const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db");

db.serialize(() => {
    db.run(
        "ALTER TABLE users ADD COLUMN expiryDate TEXT",
        (err) => {
            if (err) {
                if (err.message.includes("duplicate column name")) {
                    console.log("expiryDate column already exists");
                } else {
                    console.error(err.message);
                }
            } else {
                console.log("expiryDate column added");
            }
        }
    );
});

db.close();
