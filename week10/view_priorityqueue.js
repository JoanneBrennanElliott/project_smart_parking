

const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

const querySql = `SELECT * FROM PriorityQueue`;

db.all(querySql, (err, rows) => {
    if (err) {
        console.error("Error reading PriorityQueue table:", err);
    } else {
        console.log("PriorityQueue table contents:");
        console.table(rows);   
    }

    db.close((err) => {
        if (err) console.error("Error closing DB:", err);
        else console.log("Database closed.");
    });
});
