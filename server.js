//JBE server service GetSpaceStatus

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const PROTO_PATH = __dirname + "/protos/smartparking.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObj = grpc.loadPackageDefinition(packageDefinition);
//console.log("grpcObj =", grpcObj);
const service = grpcObj.smartparking.SmartParkingService;

const server = new grpc.Server();
server.addService(service.service, { 
	GetSpaceStatus: getSpaceStatus,
	BookDisabledSpace: bookDisabledSpace
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
  
  
function bookDisabledSpace(call, callback) { 

	console.log("Client connected to SpaceStatus");
	const userId = call.request.userId;
	const spaceId = call.request.spaceId;
	
	const success = Math.random() > 0.3;
	const message = success? "successful booking "  : "Not confirmed- issue";
	
	const timestampExpiry = CurrentTimestamp();
	//const reservationExpiry
	
	callback (null, {
		success,
		message,
		spaceId,
		timestampExpiry
	});
}
//Implement service methods (unary signature: (call, callback)) 
//function passing in a random spaceId to Check SpaceStatus is true or false //operating

function getSpaceStatus(call, callback) { 

	console.log("Client connected to SpaceStatus");
	const spaceId = call.request.spaceId;
	const isOccupied = Math.random() > 0.3;
	//const statusMessage = isOccupied? "Occupied "  : "UnOccupied ";
	const isDisabledSpace = Math.random() > 0.3;
	//temp hardcode zone 
	const zone =  isDisabledSpace? "  Ground floor - Disabled Space"  : " Ground floor - Regular parking space";
	
	callback (null, {
		spaceId,
		isOccupied,
		isDisabledSpace,
		zone
	});
}
