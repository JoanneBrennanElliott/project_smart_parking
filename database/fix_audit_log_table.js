const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

// Step 1 — Rename old table
const renameSql = `
ALTER TABLE audit_log RENAME TO audit_log_old;
`;

// Step 2 — Create new table with correct localtime default
const createSql = `
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT (datetime('now','localtime'))
);
`;

// Step 3 — Copy old data into new table
const copySql = `
INSERT INTO audit_log (id, username, action, timestamp)
SELECT id, username, action, timestamp FROM audit_log_old;
`;

// Step 4 — Drop old table
const dropSql = `
DROP TABLE audit_log_old;
`;

db.serialize(() => {
    console.log("Renaming old audit_log table...");
    db.run(renameSql, (err) => {
        if (err) {
            console.error("Error renaming table:", err.message);
            return;
        }
        console.log("Old table renamed.");

        console.log("Creating new audit_log table...");
        db.run(createSql, (err) => {
            if (err) {
                console.error("Error creating new table:", err.message);
                return;
            }
            console.log("New table created.");

            console.log("Copying old data...");
            db.run(copySql, (err) => {
                if (err) {
                    console.error("Error copying data:", err.message);
                    return;
                }
                console.log("Data copied.");

                console.log("Dropping old table...");
                db.run(dropSql, (err) => {
                    if (err) {
                        console.error("Error dropping old table:", err.message);
                        return;
                    }
                    console.log("Old table dropped.");
                    console.log("\n🎉 Audit log table successfully rebuilt with correct local timestamps!");
                    db.close();
                });
            });
        });
    });
});
