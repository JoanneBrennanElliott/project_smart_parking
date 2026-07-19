const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open database:", err);
        process.exit(1);
    }
});

const migrationSQL = `
PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

CREATE TABLE PriorityQueue_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    carReg TEXT NOT NULL,
    spaceType TEXT NOT NULL,
    timestampQueued INTEGER NOT NULL
);

INSERT INTO PriorityQueue_new (id, userId, carReg, spaceType, timestampQueued)
SELECT id, userId, carReg, spaceType, timestampQueued
FROM PriorityQueue;

DROP TABLE PriorityQueue;

ALTER TABLE PriorityQueue_new RENAME TO PriorityQueue;

COMMIT;

PRAGMA foreign_keys = ON;
`;

db.exec(migrationSQL, (err) => {
    if (err) {
        console.error("Migration failed:", err);
    } else {
        console.log("PriorityQueue migration complete: userId is now TEXT.");
    }
    db.close();
});
