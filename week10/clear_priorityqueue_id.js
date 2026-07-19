// remove_priorityqueue_id2.js
// Simple runnable script to delete id=2 from PriorityQueue

const sqlite3 = require("sqlite3").verbose();

// Path to your DB — adjust if needed
const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Failed to open database:", err);
        process.exit(1);
    }
});

// EXAMPLE  ---Delete row with id = 2
const idToDelete = 2;

db.run(
    `DELETE FROM PriorityQueue WHERE id = ?`,
    [idToDelete],
    function (err) {
        if (err) {
            console.error("Error deleting row:", err);
        } else {
            console.log(`Row with id=${idToDelete} deleted successfully.`);
            console.log(`Changes made: ${this.changes}`);
        }

        // Close DB connection
        db.close();
    }
);
