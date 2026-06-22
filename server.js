//JBE server service GetSpaceStatus

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const PROTO_PATH = __dirname + "/protos/smartparking.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObj = grpc.loadPackageDefinition(packageDefinition);
//console.log("grpcObj =", grpcObj);
const service = grpcObj.smartparking.SmartParkingService;

const fs = require("fs");

const server = new grpc.Server();
server.addService(service.service, { 
	GetSpaceStatus: getSpaceStatus,
	BookDisabledSpace: bookDisabledSpace,
	StartParkingTimer: StartParkingTimer,
	StreamParkingTimer: StreamParkingTimer,
	BookSpace: BookSpace,
	});


// Bind 
server.bindAsync(
  "0.0.0.0:40000",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("SmartParkingService running on port 40000");
	
    //server.start();
  }
);
  
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

					return res.json({success: true,userId: row.username, 
						returning: isReturning,
						lastLogin: row.last_time_login});

			});
		});
});
  
const bookedSpaces = new Map();
// key: "PATIENT-044"
// value: { isDisabled: true/false, zone: "PATIENT" }

  
const ZONES = {
    standard: ["STAFF", "DELIVERY", "VISITOR"],
    disabled: ["PATIENT", "VISITOR"]   // two valid zones
};

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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `bookings-${year}-${month}-${day}.log`;
}

 
  // Book regular space 
function BookSpace(call, callback) {
	
	const userId = call.request.userId;
	const carReg = call.request.carReg;
	const { zone, spaceId }  = generateStandardSpaceId();  // STAFF / VISITOR

	const bookingRef = generateBookingRef();
   
	const success = true;
    const message = "successful booking";
	
   const timestampExpiry = CurrentTimestamp();
	   
	if (success) {
		bookedSpaces.set(spaceId, {
        isDisabled: false,
        zone: zone,   // PATIENT or VISITOR
	   timestampBooked: CurrentTimestamp()
    });
	   
	
console.log(
    `NEW STANDARD BOOKING : ${spaceId} | Zone: ${zone} | User: ${userId} | Car: ${carReg} | Booked: ${CurrentTimestamp()}`
);

logToFile(`Booked: ${spaceId} | Zone: ${zone} | User: ${userId} | Car: ${carReg} | Disabled: false`);
}
    callback(null, {
		success,
		message,
		spaceId,
		timestampExpiry,
		userId,
		carReg,
		bookingRef
		});
	}

    
function bookDisabledSpace(call, callback) { 

	const userId = call.request.userId;
	 const carReg = call.request.carReg; 
    const { zone, spaceId } = generateDisabledSpaceId();  
   
    const bookingRef = generateBookingRef();
	
	const success = Math.random() > 0.3;
	const message = success? "successful booking "  : "Not confirmed- issue";
	const timestampExpiry = CurrentTimestamp();
	//const reservationExpiry

	if (success) {
		bookedSpaces.set(spaceId, {
        isDisabled: true,
        zone: zone,   // PATIENT or VISITOR
       timestampBooked: CurrentTimestamp()
	   });
	   

	console.log(
		`NEW DISABLED BOOKING : ${spaceId} | Zone: ${zone} | User: ${userId} | Car: ${carReg} | Booked: ${CurrentTimestamp()}`
	);

	}
	callback (null, {
		success,
		message,
		spaceId,
		timestampExpiry,
		userId, 
		carReg,
		bookingRef
	});
	
logToFile(`Booked: ${spaceId} | Zone: ${zone} | User: ${userId} | Car: ${carReg} | Disabled: true`);

}
//Implement service methods (unary signature: (call, callback)) 
//function passing in a random spaceId to Check SpaceStatus is true or false //operating

function getSpaceStatus(call, callback) { 

	//console.log("Client connected to SpaceStatus");
	
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
	//const isOccupied = Math.random() > 0.3;
	//const statusMessage = isOccupied? "Occupied "  : "UnOccupied ";
	//const isDisabledSpace = Math.random() > 0.3;
	//temp hardcode zone 
	//const zone =  isDisabledSpace? "  Ground floor - Disabled Space"  : " Ground floor - Regular parking space";
	
	//callback (null, {
	//	spaceId,
	//	isOccupied,
	//	isDisabledSpace,
	//	zone
	//});


// ---- Parking Timer ---- 
function StartParkingTimer(call, callback) { 

	console.log("Client connected to StartParkingTimer");
	const userId = call.request.userId;
	const entryTimestamp = call.request.entryTimestamp;
	
	// Convert entry timestamp to a Date object
    const entryTime = new Date(entryTimestamp);

    // Add 30 minutes (30 * 60 * 1000 ms)
    const expiryTime = new Date(entryTime.getTime() + 30 * 60 * 1000);

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
    const nearingExpiry = remainingMs <= 5 * 60 * 1000;
	
	callback (null, {
		timeRemaining,	 // (in seconds or mm:ss)	
		nearingExpiry    // (true if < 5 minutes left)
	});
}

function StreamParkingTimer(call) {
    console.log("Client connected to StreamParkingTimer");
	
	const userId = call.request.userId;
    const entryTimestamp = call.request.entryTimestamp;
    const entryTime = new Date(entryTimestamp);

   // const expiryTime = new Date(entryTime.getTime() + 30 * 60 * 1000);
    const expiryTime = new Date(entryTime.getTime() + 30 * 60 * 1000);
	//const expiryTime = new Date(entryTime.getTime() + 10 * 1000); // 10 seconds

    const interval = setInterval(() => {
        const now = new Date();
        let remainingMs = expiryTime - now;

        if (remainingMs < 0) remainingMs = 0;

        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);

        const timeRemaining = `${minutes}m ${seconds}s`;
        const nearingExpiry = remainingMs <= 5 * 60 * 1000;
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
	

function generateDisabledSpaceId() {
    const zoneList = ZONES.disabled;
    const zone = zoneList[Math.floor(Math.random() * zoneList.length)];

    let spaceId;

    // Safety: ensure bookedSpaces exists and is a Map
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


function generateStandardSpaceId() {
	const zoneList = ZONES.standard;  
    const zone = zoneList[Math.floor(Math.random() * zoneList.length)];
	const number = Math.floor(Math.random() * 200) + 1;
	
    return {
        zone,
        spaceId: `${zone}-${String(number).padStart(3, "0")}`
    };	}
