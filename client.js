//JBE client service SmartParkingService

// client.js


var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/smartparking.proto"

const path = require("path");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObj = grpc.loadPackageDefinition(packageDefinition);
const service = grpcObj.smartparking.SmartParkingService;

var client = new service("0.0.0.0:40000", grpc.credentials.createInsecure());

//Adding Naming Service - to do 
//var client = new service("parking-service:40000", grpc.credentials.createInsecure());

//make unary request
client.getSpaceStatus (
	{ spaceId : "1001"},  
	(err, response) => {
		  if (err) {
    console.error("Remote Invocation Error", err);
    return;
  }
  console.log("Response:", response);
});

//const request = { userId: "JBE1002", spaceId : "1022" };

//make unary request
client.BookDisabledSpace({ spaceId: "A1", userId: "123" }, (err, response) => {
  if (err) {
    console.error("Remote Invocation Error", err);
    return;
  }
  console.log("Response:", response);
});

		}
	});
