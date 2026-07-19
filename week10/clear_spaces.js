const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

// SQL to reset the fields
const resetSql = `
    UPDATE Spaces
    SET isBooked = 0,
        userId = NULL,
        carReg = NULL
`;

db.run(resetSql, function (err) {
    if (err) {
        console.error("Error resetting Spaces table fields:", err);
    } else {
        console.log("Spaces table fields updated.");
        console.log(`Rows updated: ${this.changes}`);
    }

    db.close((err) => {
        if (err) console.error("Error closing DB:", err);
        else console.log("Database closed.");
    });
});
