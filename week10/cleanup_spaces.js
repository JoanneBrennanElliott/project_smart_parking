
const sqlite3 = require("sqlite3").verbose();

// Adjust path if your DB file has a different name/location
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open DB:", err);
        return;
    }
    console.log("Connected to users.db");
});

db.run(
    `DELETE FROM spaces
WHERE isBooked = 0
AND spaceNumber LIKE 'DISABLED-%'`,

    function (err) {
        if (err) {
            console.error("Error deleting row:", err);
        } else {
	        }

        // Close DB connection
        db.close();
    }
);

