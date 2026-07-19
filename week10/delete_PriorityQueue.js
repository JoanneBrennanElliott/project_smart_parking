const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

// SQL to clear the table
const clearSql = `DELETE FROM PriorityQueue`;

db.run(clearSql, function (err) {
    if (err) {
        console.error("Error clearing PriorityQueue table:", err);
    } else {
        console.log("PriorityQueue table has been cleared.");
        console.log(`Rows affected: ${this.changes}`);
    }

    db.close((err) => {
        if (err) console.error("Error closing DB:", err);
        else console.log("Database closed.");
    });
});
