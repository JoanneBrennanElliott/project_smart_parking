// JBE Smart Parking System 
// Student Name : Joanne Brennan Elliott
// Student Number : X23410001
// Date : 12/07/2026

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const PROTO_PATH = __dirname + "/protos/smartparking.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObj = grpc.loadPackageDefinition(packageDefinition);
const service = grpcObj.smartparking.SmartParkingService;

const express = require("express");
const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const fs = require("fs");
//const path = require("path");

// Ensure logs directory exists
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "joannebrennanelliott@gmail.com",
        pass: "jckg rfme arbf umug"
    }
});


const client = new service(
    "localhost:40000",
    grpc.credentials.createInsecure()
);


const server = new grpc.Server();
server.addService(service.service, { 
	BookDisabledSpace: bookDisabledSpace,
	StreamParkingTimer: StreamParkingTimer,
	BookSpace: BookSpace,
	});

//	GetSpaceStatus: getSpaceStatus, - JBE removed this call  - redundant
//	StartParkingTimer: StartParkingTimer, - JBE removed this call


// Bind 
server.bindAsync(
  "0.0.0.0:40000",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("SmartParkingService running on port 40000");
	
    //server.start();
  }
);
  
const sqlite3 = require("sqlite3").verbose();
//const db = new sqlite3.Database("users.db"); 
const db = new sqlite3.Database(path.join(__dirname, "users.db"));

let currentLoggedInUser = null;

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.post("/login", (req, res) => {
    const { username, password } = req.body;

	db.get(
		
		"SELECT * FROM users WHERE username = ?",
		[username],
		(err, row) => {
 			if (err) {
                console.error("DB ERROR in /login:", err);
                return res.json({ success: false, message: "Database error" });
            }

            if (!row) {
                console.log(`LOGIN FAIL : User '${username}' not found`);
				logAudit(username, "Login attempt for non‑existent user");
                return res.json({ success: false, message: "User not found" });
            }
				
			//adding password hashing
			bcrypt.compare(password, row.password, (err, match) => {

				if (err) {
					console.error("Compare error:", err);
					logAudit(username, "Failed login attempt");
					return res.json({ success: false, message: "Error checking password" });
				}

				if (!match) {
					console.log(`LOGIN FAIL : Incorrect password for '${username}'`);
					logAudit(username, "Failed login attempt");
					return res.json({ success: false, message: "Incorrect password" });
				}
				
				if (row.disabledAccess === 1) {
					const userPermit = req.body.permitNumber;
					const storedPermit = row.permitNumber;

					if (!userPermit || userPermit !== storedPermit) {
						return res.json({
							success: false,
							message: "Permit number does not match our records"
						});
					}

					const userEntered = req.body.loginExpiryDate;
					const stored = row.expiryDate;

					if (!userEntered || userEntered !== stored) {
						return res.json({
							success: false,
							message: "Permit expiry date does not match our records"
						});
					}
				}
				

				const isReturning = row.hasLoggedInBefore   === 1;
				
				const lastLogin = row.last_time_login;
				currentLoggedInUser = row.username;

				//added last_time_login into users table
				    db.run( "UPDATE users SET hasLoggedInBefore   = 1, last_time_login = datetime('now', 'localtime') WHERE username = ?",
                    [row.username],
                    (updateErr) => {
                        if (updateErr) {
                            console.error("DB update error:", updateErr);
						}
                    });		
					//logAudit(row.username, "Successful login");
					logAudit(username, "Successful login");

					return res.json({success: true,
						userId: row.username, 
						returning: isReturning,
						lastLogin: row.last_time_login,
						disabledAccess: row.disabledAccess,
						permitNumber: row.permitNumber,
						expiryDate: row.expiryDate,  email: row.email});

			});
		});
});


app.post("/register", (req, res) => {
    const { username, password, disabledAccess, permitNumber, expiryDate } = req.body;

console.log("REGISTER expiryDate:", expiryDate);
console.log("REGISTER disabledAccess:", disabledAccess);

    if (!username || !password) {
        return res.json({ success: false, message: "Username and password required" });
    }
	
    if (disabledAccess) {
   
	   if (permitNumber && (!expiryDate || isNaN(Date.parse(expiryDate)))) {
			return res.json({ success: false, message: "Valid permit number and expiry date required" });
		}

			const today = new Date().setHours(0,0,0,0);
			const exp = new Date(expiryDate).setHours(0,0,0,0);

			if (exp < today) {
				return res.json({ success: false, message: "Expiry date cannot be in the past" });
			}
    }

   bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error("Hashing error:", err);
            return res.json({ success: false, message: "Error hashing password" });
        }
		
		db.run(
		  `INSERT INTO users 
		  (username, password, hasLoggedInBefore, disabledAccess, permitNumber, expiryDate) 
			VALUES (?, ?, 0, ?, ?, ?)`,
			[username, 
			hashedPassword, 
			disabledAccess ? 1 : 0,
			disabledAccess ? permitNumber : null,
			disabledAccess ? expiryDate : null
			],
			function (err) {
				if (err) {
					if (err.message.includes("UNIQUE")) {
						logAudit(username, "Failed login attempt");
						return res.json({ success: false, message: "Username already exists" });
					}
					logAudit(username, "Login attempt for non‑existent user");
					return res.json({ success: false, message: "Registration failed" });
				}

				logAudit(username, "Successful login");   // new admin logging
				res.json({ success: true, message: "User registered successfully" });
}
		);
	});
});


app.post("/bookSpace", (req, res) => {
    if (!currentLoggedInUser) {
        console.log("No logged-in user");
        return res.json({ success: false, message: "Not logged in" });
    }

    const email = req.body.email;
	
	if (!req.body.email || !req.body.email.includes("@")) {
		return res.json({ success: false, message: "Valid email required before booking." });
	}

    db.run(
        "UPDATE users SET email = ? WHERE username = ?",
        [email, currentLoggedInUser],
        (err) => {
            if (err) console.error("Email update error:", err.message);
        }
    );
	
	const isEV = req.body.isEV ? 1 : 0;    //new Ev logic

	db.run(
		"UPDATE users SET isEV = ? WHERE username = ?",
		[isEV, currentLoggedInUser]
	);


    const carReg = req.body.carReg || "UNKNOWN";

    console.log("Booking space for:", currentLoggedInUser, "Reg:", carReg);
    
	client.BookSpace(
        { userId: currentLoggedInUser, carReg: carReg },
        (err, response) => {
            if (err) {
                console.error("gRPC Error:", err);
                return res.json({ success: false, message: "Standard booking failed" });
            }

            const success = response.message.includes("successful");
			
			 if (!success) {
				console.log("Booking failed, skipping DB insert");
				return res.json({
					success,
					message: response.message,
					userId: response.userId,
					carReg: carReg,
					spaceId: response.spaceId,
					bookingRef: response.bookingRef,
					timestampExpiry: response.timestampExpiry,
					email
				});
			}
			
			db.run(
		  `INSERT INTO bookings (userId, carReg, spaceNumber, timestamp, bookingRef)
		   VALUES (?, ?, ?, ?, ?)`,
		  [
			response.userId,
			response.carReg,
			response.spaceId,
			response.timestampExpiry,
			response.bookingRef
		  ],
		 (err) => {
			if (err) {
					console.error("DB insert error:", err.message);
				} else {
					console.log("Booking saved to DB");
				}
			}
		);

            res.json({
                success,
                message: response.message,
                userId: response.userId,
				carReg: carReg,
                spaceId: response.spaceId,
				bookingRef: response.bookingRef,
                timestampExpiry: response.timestampExpiry,
				email
            });
			
			//email if successful booking
			if (success) {
				sendBookingEmail(email, {
					bookingRef: response.bookingRef,
					userId: response.userId,
					carReg: response.carReg,
					spaceId: response.spaceId,
					timestampExpiry: response.timestampExpiry
				});
			}

			
				// Log the booking in the audit log
				if (response.spaceId) {
					logAudit(
						currentLoggedInUser,`Booked parking space ${response.spaceId}`
					);
				} else {
					console.error("No spaceId returned in response:", response);
				}

        }
    );
	
});

app.post("/bookDisabledSpace", (req, res) => {
    if (!currentLoggedInUser) {
        console.log("No logged-in user");
        return res.json({ success: false, message: "Not logged in" });
    }
	
	const carReg = req.body.carReg || "UNKNOWN";
	const email = req.body.email;
		
	if (!req.body.email || !req.body.email.includes("@")) {
		return res.json({ success: false, message: "Valid email required before booking." });
	}

    db.run(
        "UPDATE users SET email = ? WHERE username = ?",
        [email, currentLoggedInUser],
        (err) => {
            if (err) console.error("Email update error:", err.message);
        }
    );

   client.BookDisabledSpace(
        { userId: currentLoggedInUser, carReg: carReg },
        (err, response) => {
            if (err) {
                console.error("gRPC Error:", err);
                return res.json({ success: false, message: "Disabled booking failed" });
            }

           //const success = response.message.includes("successful");
			 const success = response.success === true;
			 
			 if (!success) {
                console.log("Disabled booking failed, skipping DB insert");

                return res.json({
                    success,
                    message: response.message,
                    userId: response.userId,
                    carReg: response.carReg,
                    spaceId: response.spaceId,
                    bookingRef: response.bookingRef,
                    timestampExpiry: response.timestampExpiry,
                    email
                });
            }
			
			db.run(
			  `INSERT INTO bookings (userId, carReg, spaceNumber, timestamp, bookingRef)
			   VALUES (?, ?, ?, ?, ?)`,
			  [
				response.userId,
				response.carReg,
				response.spaceId,
				response.timestampExpiry,
				response.bookingRef
			  ],
			 (err) => {
				if (err) {
						console.error("DB insert error:", err.message);
					} else {
						console.log("Booking saved to DB");
					}
				}
			);

            res.json({
                success,
                message: response.message,
                userId: response.userId,
				carReg: carReg,
                spaceId: response.spaceId,
				bookingRef: response.bookingRef,
                timestampExpiry: response.timestampExpiry,
				email
            });
			
			if (success) {
				sendBookingEmail(email, {
					bookingRef: response.bookingRef,
					userId: response.userId,
					carReg: response.carReg,
					spaceId: response.spaceId,
					timestampExpiry: response.timestampExpiry
				});
			}

				// Log the booking in the audit log
				if (response.spaceId) {
					logAudit(
						currentLoggedInUser,`Booked Disabled parking space ${response.spaceId}`
					);
				} else {
					console.error("No spaceId returned in response:", response);
				}

		}
    );
});

app.get("/findMyCar", (req, res) => {
    if (!currentLoggedInUser) {
        return res.json({ success: false, message: "Not logged in" });
    }

    db.get(
        "SELECT spaceNumber FROM bookings WHERE userId = ? ORDER BY id DESC LIMIT 1",
        [currentLoggedInUser],
        (err, row) => {
            if (err) {
                console.error("DB error:", err);
                return res.json({ success: false, message: "Database error" });
            }

            if (!row) {
                return res.json({ success: false, message: "No active booking found" });
            }
			
            const [zone, spaceId] = row.spaceNumber.split("-");
			return res.json({ success: true, zone, spaceId });      
		 }	
	);
});

app.post("/logout", (req, res) => {
	
 
    if (!currentLoggedInUser) {
         console.log("No logged-in user");
        return res.json({ success: false, message: "Not logged in" });    }

    // Log the audit entry
    logAudit(currentLoggedInUser, "Logged out");

    console.log(`User '${currentLoggedInUser}' logged out`);

    // Clear the server-side session variable
    currentLoggedInUser = null;

    return res.json({ success: true, message: "Logout successful" });
});

app.get("/startTimer", (req, res) => {
	
	
	const userId = req.query.userId || currentLoggedInUser;
    const entryTimestamp = req.query.entryTimestamp;

    //const currentLoggedInUser = req.query.userId;  
    //const entryTimestamp = req.query.entryTimestamp;
	//	if (!currentLoggedInUser) {
    //    return res.status(401).json({ error: "Not logged in" });
	//}
	
	if (!userId) {
		return res.status(401).json({ error: "Not logged in" });
    }
	
    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log("Timer stream started for:", userId);

    // Start streaming
    const stream = client.StreamParkingTimer({
        userId,
        entryTimestamp
    });
	
	//console.log("DEBUG currentLoggedInUser:", currentLoggedInUser);
	//console.log("DEBUG userId:", userId);


    stream.on("data", (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

	//end
    stream.on("end", () => {
        //console.log("Timer stream ended");
        res.end();
    });

	//error
	stream.on("error", (err) => {
		if (err.code === 1) {  // 1 = CANCELLED
			//console.log("Timer stream cancelled by client");
			return;  
		}
		//console.error("gRPC timer error:", err);
		res.end();
	});

	//close
    req.on("close", () => {
       // console.log("Browser closed connection early");
        stream.cancel();
    });
});

app.listen(3000, () => {
    console.log("Auth server running on port 3000");
});

 //JBE removed this original functionalaity and replaced it with getting spaces from the spaces db table 
//const bookedSpaces = new Map();
// key: "PATIENT-044"
// value: { isDisabled: true/false, zone: "PATIENT" }

  
//const ZONES = {
//    standard: ["STAFF", "DELIVERY", "VISITOR"],
 //   disabled: ["PATIENT", "VISITOR"]   // two valid zones
//};

function logAudit(username, action) {
    db.run(
        "INSERT INTO audit_log (username, action) VALUES (?, ?)",
        [username, action],
        (err) => {
            if (err) console.error("Audit log error:", err);
        }
    );
}


function logToFile(text) {
    try {
        const timestamp = new Date().toLocaleString();
        const line = `[${timestamp}] ${text}\n`;

        const fileName = getLogFileName();

        fs.appendFile(fileName, line, (err) => {
            if (err) {
                console.error("Error writing to log file:", err);
            }
        });
    } catch (e) {
        console.error("Unexpected logging error:", e);
    }
}

function getLogFileName() {
    //const now = new Date();
    //const year = now.getFullYear();
   // const month = String(now.getMonth() + 1).padStart(2, "0");
   // const day = String(now.getDate()).padStart(2, "0");
	 //return `bookings-${year}-${month}-${day}.log`;
       const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
     return path.join(logDir, `bookings-${date}.log`);
}

 
  // Book regular space 
function BookSpace(call, callback) {
	
	const userId = call.request.userId;
	const carReg = call.request.carReg;

	
	db.get("SELECT * FROM users WHERE username = ?", [userId], (err, user) => {
	if (err || !user) {
		return callback(null, {
			success: false,
			message: "User not found",
			userId,
			carReg,
			spaceId: "",
			bookingRef: "",
			timestampExpiry: ""
		});
	}
		 //JBE 11/07/26 - upgrading this function to include if user wants to book an EV space
	if (user.isEV === 1) {
		// auto-assign EV space
	   db.get(
		"SELECT * FROM spaces WHERE isBooked = 0 AND spaceNumber LIKE 'EV-%' LIMIT 1",
		(err, space) => {
			if (err) {
				console.error("DB error:", err);
				return callback(null, {
					success: false,
					message: "Database error",
					userId,
					carReg,
					spaceId: "",
					bookingRef: "",
					timestampExpiry: ""
				});
			}

		   if (!space) {
				return callback(null, {
					success: false,
					message: "No EV spaces available, please contact helpline",
					userId,
					carReg,
					spaceId: "",
					bookingRef: "",
					timestampExpiry: ""
				});
			}
			
			// Mark EV space as booked
				db.run(
				`UPDATE spaces 
				 SET isBooked = 1, userId = ?, carReg = ?
				 WHERE id = ?`,
				[userId, carReg, space.id],
				(err) => {
					if (err) {
						console.error("Space update error:", err);
						return callback(null, {
							success: false,
							message: "Failed to book EV space",
							userId,
							carReg,
							spaceId: "",
							bookingRef: "",
							timestampExpiry: ""
						});
					}

					 const bookingRef = generateBookingRef();
					 const timestampExpiry = CurrentTimestamp();
					//const success = true;
				   // const message = "successful booking";
		   
	
					console.log(
						`NEW EV BOOKING : ${space.spaceNumber} | User: ${userId} | Car: ${carReg} | Booked: ${CurrentTimestamp()}`
					);

					logToFile(
							`Booked: ${space.spaceNumber} | User: ${userId} | Car: ${carReg} | EV: true`
					);

					return callback(null, {
						success: true,
						message: "EV space booking successful",
						spaceId: space.spaceNumber,
						timestampExpiry,
						userId,
						carReg,
						bookingRef
					});				
				});
			}
		);
	   
	     return; // IMPORTANT: prevents normal booking logic from running
        }
		
		//resume normal booking Space (non‑EV users)
		// 3. NORMAL BOOKING LOGIC (non‑EV users)
		db.get(
			`SELECT * FROM spaces 
			 WHERE isBooked = 0 AND (
				 spaceNumber LIKE 'STAFF-%' OR
				 spaceNumber LIKE 'VISITOR-%' OR
				 spaceNumber LIKE 'PATIENT-%'
			 )
			 LIMIT 1`,
			(err, space) => {
				if (err) {
					console.error("DB error:", err);
					return callback(null, {
						success: false,
						message: "Database error",
						userId,
						carReg,
						spaceId: "",
						bookingRef: "",
						timestampExpiry: ""
					});
				}

				if (!space) {
					return callback(null, {
						success: false,
						message: "No regular spaces available, please contact helpline",
						userId,
						carReg,
						spaceId: "",
						bookingRef: "",
						timestampExpiry: ""
					});
				}
				
				else {
				// Mark normal space as booked
				db.run(
					`UPDATE spaces 
					 SET isBooked = 1, userId = ?, carReg = ?
					 WHERE id = ?`,
					[userId, carReg, space.id],
					(err) => {
						if (err) {
							console.error("Space update error:", err);
							return callback(null, {
								success: false,
								message: "Failed to book space",
								userId,
								carReg,
								spaceId: "",
								bookingRef: "",
								timestampExpiry: ""
							});
						}

						const bookingRef = generateBookingRef();
						const timestampExpiry = CurrentTimestamp();

						console.log(
							`NEW STANDARD BOOKING : ${space.spaceNumber} | User: ${userId} | Car: ${carReg}`
						);

						logToFile(
							`Booked: ${space.spaceNumber} | User: ${userId} | Car: ${carReg} | Disabled: false`
						);

						return callback(null, {
							success: true,
							message: "Standard space booking successful",
							spaceId: space.spaceNumber,
							timestampExpiry,
							userId,
							carReg,
							bookingRef
						});
					}
					);
				}
			}
		);
	});
		
	};
	
	/*
	//JBE no longer using this auto gen Space
	const { zone, spaceId }  = generateStandardSpaceId();  // STAFF / VISITOR
	if (success) {
		bookedSpaces.set(spaceId, {
        isDisabled: false,
        zone: zone,   // PATIENT or VISITOR
	   timestampBooked: CurrentTimestamp()
    });*/

  
function bookDisabledSpace(call, callback) { 

	const userId = call.request.userId;
	 const carReg = call.request.carReg; 
 

    //JBE 11/07/26 - upgrading the functionality to auto assign 
	// a disabled space with new logic from new space table and set it as booked

	//const { zone, spaceId } = generateDisabledSpaceId();  

   // Find first free disabled space in DB - NEW upgrade from generateDisabledSpaceId 11/07/26 JBE 
    db.get(
        "SELECT * FROM spaces WHERE isBooked = 0 AND spaceNumber LIKE 'DISABLED-%' LIMIT 1",
        (err, space) => {
            if (err) {
                console.error("DB error:", err);
                return callback(null, {
                    success: false,
                    message: "Database error",
                    userId,
                    carReg,
                    spaceId: "",
                    bookingRef: "",
                    timestampExpiry: ""
                });
            }
			if (!space) {
                return callback(null, {
                    success: false,
                    message: "No disabled spaces available, please contact helpline",
                    userId,
                    carReg,
                    spaceId: "",
                    bookingRef: "",
                    timestampExpiry: ""
                });
            }
			
			 // Mark space as booked
            db.run(
                `UPDATE spaces 
                 SET isBooked = 1, userId = ?, carReg = ?
                 WHERE id = ?`,
                [userId, carReg, space.id],
                (err) => {
                    if (err) {
                        console.error("Space update error:", err);
                        return callback(null, {
                            success: false,
                            message: "Failed to book disabled space",
                            userId,
                            carReg,
                            spaceId: "",
                            bookingRef: "",
                            timestampExpiry: ""
                        });
                    }
   
					const bookingRef = generateBookingRef();
					const timestampExpiry = CurrentTimestamp();
					/*const success = Math.random() > 0.3;
					//const message = success? "successful booking "  : "Not confirmed- issue";

					if (success) {
						bookedSpaces.set(spaceId, {
						isDisabled: true,
						zone: zone,   // PATIENT or VISITOR
					   timestampBooked: CurrentTimestamp()
					   });
					 */ 

					console.log(
						`NEW DISABLED BOOKING : ${space.spaceNumber} | User: ${userId} | Car: ${carReg} | Booked: ${CurrentTimestamp()}`
					);
					
				   logToFile(
							`Booked: ${space.spaceNumber} | User: ${userId} | Car: ${carReg} | Disabled: true`
					);

					//return to express
					callback (null, {
						//success,
						//message,
						//spaceId,
						success: true,
						message: "Disabled space booking successful",
						spaceId: space.spaceNumber,
						timestampExpiry,
						userId, 
						carReg,
						bookingRef
					});
				}
			);
        }
    );
//logToFile(`Booked: ${spaceId} | Zone: ${zone} | User: ${userId} | Car: ${carReg} | Disabled: true`);

}

//Implement service methods (unary signature: (call, callback)) 
//function passing in a random spaceId to Check SpaceStatus is true or false //operating

/*
function getSpaceStatus(call, callback) { 
	
	const spaceId = call.request.spaceId;
	
	    const record = bookedSpaces.get(spaceId);

    if (!record) {
        // space not booked
        return callback(null, {
            spaceId,
            isOccupied: false,
            isDisabledSpace: false,
            zone: ""
        });
    }

    // space is booked
    callback(null, {
        spaceId,
        isOccupied: true,
        isDisabledSpace: record.isDisabled,
        zone: record.zone
    });
	}
*/

// ---- Parking Timer ---- 
/*function StartParkingTimer(call, callback) { 

	console.log("Client connected to StartParkingTimer");
	const userId = call.request.userId;
	const entryTimestamp = call.request.entryTimestamp;
	
	// Convert entry timestamp to a Date object
    const entryTime = new Date(entryTimestamp);

	//hardcoded
    // Add 30 minutes (30 * 60 * 1000 ms)
    //const expiryTime = new Date(entryTime.getTime() + 30 * 60 * 1000);
    const expiryTime = new Date(entryTime.getTime() + 5 * 60 * 1000);

    const now = new Date();

    // Calculate remaining time in milliseconds
    let remainingMs = expiryTime - now;

    // Prevent negative values
    if (remainingMs < 0) remainingMs = 0;

    // Convert to minutes + seconds
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    const timeRemaining = `${minutes}m ${seconds}s`;

    // nearing expiry if less than 5 minutes left
    //const nearingExpiry = remainingMs <= 5 * 60 * 1000;
  const nearingExpiry = remainingMs <= 1 * 60 * 1000;
	
	callback (null, {
		timeRemaining,	 // (in seconds or mm:ss)	
		nearingExpiry    // (true if < 5 minutes left)
	});
}
*/

function StreamParkingTimer(call) {
    console.log("Client connected to StreamParkingTimer");
	
	const userId = call.request.userId;
    const entryTimestamp = call.request.entryTimestamp;
    const entryTime = new Date(entryTimestamp);

    const expiryTime = new Date(entryTime.getTime() + 30 * 60 * 1000);   //30 mins
	//const expiryTime = new Date(entryTime.getTime() + 10 * 1000); // 10 seconds Testing purposes
	
	//const expiryTime = new Date(entryTime.getTime() + 2 * 60 * 1000); // 2 mins Testing

    const interval = setInterval(() => {
        const now = new Date();
        let remainingMs = expiryTime - now;

        if (remainingMs < 0) remainingMs = 0;

        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);

        const timeRemaining = `${minutes}m ${seconds}s`;
       
	    const nearingExpiry = remainingMs <= 5 * 60 * 1000;
       // const nearingExpiry = remainingMs <= 1 * 60 * 1000;
       //const nearingExpiry =true;

        // Send update to client
        call.write({
            timeRemaining: timeRemaining,
            nearingExpiry: nearingExpiry
        });

        // Stop streaming when timer ends
        if (remainingMs <= 0) {
            call.end();
            clearInterval(interval);
        }

    }, 1000); // every second

    // If client disconnects early
    call.on("cancelled", () => {
        clearInterval(interval);
        console.log("Client disconnected from StreamParkingTimer");
    });
}



//to do add 6 hours 
function CurrentTimestamp() {
  const now = new Date();
  return now.toLocaleString("en-GB"); 
}
	

/*function generateDisabledSpaceId() {
    const zoneList = ZONES.disabled;
    const zone = zoneList[Math.floor(Math.random() * zoneList.length)];

    let spaceId;

    // make sure bookedSpaces exists and is a Map
    if (!bookedSpaces || typeof bookedSpaces.has !== "function") {
        throw new Error("bookedSpaces Map is not initialized before calling generateDisabledSpaceId()");
    }

    do {
        const number = Math.floor(Math.random() * 200) + 1;
        spaceId = `${zone}-${String(number).padStart(3, "0")}`;
    } 
    while (bookedSpaces.has(spaceId));
    return { zone, spaceId };
}
*/

/*function generateStandardSpaceId() {
	const zoneList = ZONES.standard;  
    const zone = zoneList[Math.floor(Math.random() * zoneList.length)];
	const number = Math.floor(Math.random() * 200) + 1;
	
    return {
        zone,
        spaceId: `${zone}-${String(number).padStart(3, "0")}`
    };	}
*/

function generateBookingRef() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const date = new Date().toISOString().slice(0,10).replace(/-/g, "");
    return `BK-${date}-${random}`;
}

function getFreeDisabledSpace(callback) {
    db.get(
        "SELECT * FROM spaces WHERE isBooked = 0 AND spaceNumber LIKE 'DISABLED-%' LIMIT 1",
        (err, row) => {
            if (err) return callback(err, null);
            callback(null, row);
        }
    );
}


function sendBookingEmail(to, booking) {

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 20px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
					
            <h2 style="color: #2a4d8f; text-align: center; margin-bottom: 10px;">
                Smart Parking – Booking Confirmation
            </h2>

            <p style="font-size: 15px; color: #333;">
                Hello,
                <br><br>
                Your parking booking has been successfully confirmed.  
                Below are your booking details:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Booking Reference:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingRef}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>User:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.userId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Car Registration:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.carReg}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Space Number:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.spaceId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>Expiry Time:</strong></td>
                    <td style="padding: 8px;">${booking.timestampExpiry}</td>
                </tr>
            </table>

            <p style="font-size: 14px; color: #555; margin-top: 20px;">
                Thank you for using the Smart Parking Control Panel.
                <br>
                Have a great day.
            </p>

            <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #888;">
                © 2026 Smart Parking Control Panel
            </div>

        </div>
    </div>
    `;

    const mailOptions = {
        from: "YOUR_EMAIL@gmail.com",
        to,
        subject: `Parking Booking Confirmation – Ref ${booking.bookingRef}`,
        html: htmlContent
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Email sending error:", err);
        } else {
            console.log("Booking confirmation email sent:", info.response);
        }
    });
}

/*function sendBookingEmail(to, booking) {

    const mailOptions = {
        from: "YOUR_EMAIL@gmail.com",
        to,
        subject: `Parking Booking Confirmation – Ref ${booking.bookingRef}`,
        text:
`Your parking booking is confirmed.

Booking Reference: ${booking.bookingRef}
User: ${booking.userId}
Car Registration: ${booking.carReg}
Space Number: ${booking.spaceId}
Expiry Time: ${booking.timestampExpiry}

Thank you for using Smart Parking Control Panel.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Email sending error:", err);
        } else {
            console.log("Booking confirmation email sent:", info.response);
        }
    });
}*/
