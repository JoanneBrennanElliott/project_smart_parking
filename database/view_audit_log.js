const sqlite3 = require("sqlite3").verbose();

// Open your database file
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

// Query the audit_log table
db.all("SELECT * FROM audit_log ORDER BY timestamp DESC", [], (err, rows) => {
    if (err) {
        console.error("Error reading audit_log:", err);
        db.close();
        return;
    }

    console.log("\n=== AUDIT LOG ENTRIES ===\n");

    if (rows.length === 0) {
        console.log("No audit log entries found.");
    } else {
        rows.forEach((row) => {
            console.log(
                `ID: ${row.id}\n` +
                `User: ${row.username}\n` +
                `Action: ${row.action}\n` +
                `Timestamp: ${row.timestamp}\n` +
                "-----------------------------"
            );
        });
    }

    db.close();
});
