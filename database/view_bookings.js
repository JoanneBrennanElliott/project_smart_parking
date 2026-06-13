const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("users.db");

db.all("SELECT * FROM bookings", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(rows);
});

db.close();
