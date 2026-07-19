const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

const createTableSql = `
CREATE TABLE PriorityQueue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    carReg TEXT NOT NULL,
    spaceType TEXT NOT NULL,   -- EV, Disabled, Standard
    timestampQueued INTEGER NOT NULL
);
`;

db.run(createTableSql, (err) => {
    if (err) {
        console.error("Error creating PriorityQueue table:", err);
    } else {
        console.log("PriorityQueue table is ready.");
    }
    db.close();
});