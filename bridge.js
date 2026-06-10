const express = require("express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const cors = require("cors");

const app = express();

const path = require("path");
const PROTO_PATH = __dirname + "/protos/smartparking.proto";


const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObj = grpc.loadPackageDefinition(packageDefinition);
//console.log("grpcObj =", grpcObj);
const service = grpcObj.smartparking.SmartParkingService;

app.use(cors());

const client = new grpcObj.smartparking.SmartParkingService(
    "localhost:40000",
    grpc.credentials.createInsecure()
);

//console.log("DIR:", __dirname);			//testing
//console.log("PROTO_PATH:", PROTO_PATH);

// SSE endpoint
app.get("/streamTimer", (req, res) => {
    const entryTimestamp = req.query.entryTimestamp;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = client.StreamParkingTimer({
        userId: "JBE1002",
        entryTimestamp: entryTimestamp
    });

    stream.on("data", (response) => {
        res.write(`data: ${JSON.stringify(response)}\n\n`);
    });

    stream.on("end", () => {
        res.write("event: end\ndata: Timer finished\n\n");
        res.end();
    });

    stream.on("error", (err) => {
        res.write(`event: error\ndata: ${err.message}\n\n`);
        res.end();
    });
});

app.post("/bookSpace", (req, res) => {
    client.BookSpace({ userId: "JBE1099" }, (err, response) => {
        if (err) {
            //console.error("gRPC Error:", err);
            //return res.json({ message: "Booking failed" });
			return res.json({ success: false, message: "Booking failed" });
        }
        const success = response.message.includes("successful");
        res.json({
            success,
            message: response.message,
            userId: response.userId,
            spaceId: response.spaceId,
			timestampExpiry: response.timestampExpiry
        });
	});
});

app.post("/bookDisabledSpace", (req, res) => {
	//remove hardcoding of spaceId and auto generate it 
   // client.BookDisabledSpace({ userId: "JBE1002", spaceId: "Ground-001" }, (err, response) => {
    client.BookDisabledSpace({ userId: "JBE1002" }, (err, response) => {
        if (err) {
            console.error("gRPC Error:", err);
           // return res.json({ message: "Disabled booking failed" });
		   return res.json({ success: false, message: "Disabled booking failed" });
        }
        const success = response.message.includes("successful");
       res.json({
            success,
            message: response.message,
            userId: response.userId,
            spaceId: response.spaceId,
			timestampExpiry: response.timestampExpiry
        });
	});
});

app.listen(3000, () => console.log("Bridge running on port 3000"));
