const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

// Your custom space identifiers
const spacesToInsert = [
    "DISABLED- 101",
    "DISABLED- 102",
    "DISABLED- 103",
    "EV- 01",
    "EV- 02",
    "EV- 03",
    "PRIORITY- 01",
    "PRIORITY- 02",
    "PRIORITY- 03",
    "DISABLED-2402",
    "DISABLED-27703",
    "EV-317601",
    "EV-356102",
    "EV-313303",
    "PRIORITY-45501",
    "PRIORITY-411552",
    "PRIORITY-41553",
    "DISABLED-551101",
    "DISABLED-5502",
    "DISABLED-55503",
    "EV-3176",
    "EV-31432",
    "EV-316403",
    "PRIORITY-6601",
    "PRIORITY-771102",
    "STAFF-81103",
    "STAFF-82103",
    "STAFF-833103",
    "STAFF-844103",
    "STAFF-85503",
   "PATIENT-16111",
   "PATIENT-16112",
   "PATIENT-16113",
   "PATIENT-16114",
   "PATIENT-16116",
   "PATIENT-16117",
   "PATIENT-16118",
   "PATIENT-16119"
];

// Insert SQL
const insertSql = `INSERT INTO spaces (spaceNumber) VALUES (?)`;

// Insert each space
spacesToInsert.forEach((space) => {
    db.run(insertSql, [space], (err) => {
        if (err) {
            console.error(`Error inserting ${space}:`, err);
        } else {
            console.log(`Inserted space: ${space}`);
        }
    });
});

// Close DB after inserts finish
setTimeout(() => {
    db.close();
    console.log("Database closed.");
}, 500);
