let http = require('http');
let fs = require('fs');
let Xbee = require('digimesh');
let PiCamera = require('pi-camera');
let moment = require('moment');
let JSONdb = require('node-json-db');

let camera = new PiCamera({
	mode: 'photo',
	output: __dirname + '/test.jpg',
	width: 1296,
	height: 972,
	timeout: 100,
	nopreview: true
});

var ipaddress = 'localhost';
var port = 8080;

var cameraID;
var sessionID = 1;
var numFrames = 0;

var db = new JSONdb('/home/pi/Documents/TE' + sessionID + '/database', true, true);

var server = http.createServer(function(req, res) {
	res.writeHead(200);
	res.end('Running..');
});
server.listen(port, function() {
	console.log((new Date()) + 'Server is listening on port ' + port);
});

console.log('test');


var xbee = new Xbee({ device: '/dev/ttyAMA0', baud: 9600 }, function() {
    console.log('xbee is ready');

    console.log('getting node identifier...');
    // ask for node identifier string
    xbee.get_ni_string(function(err, data) {
        if (err) return console.err(err);
        console.log("my NI is '" + data.ni + "'");
    });
    cameraID = xbee.address;
    console.log(xbee.address); 
});

var makePath = function(path) {
	fs.mkdir(path, function(err) {
		if (err) {
			if (err.code = 'EEXIST');
		} else {
			console.log('made dir');
		}		
	});
}

var takeFrame = function(session, condition) {
	var path = '/home/pi/Documents/TE' + session;
	makePath(path);
	path += '/frames';
	makePath(path);
    var time = moment();
    .then((result) => {
		console.dir(result);
		console.log('snapped picture');
		db.push('/frame' + numFrames, {camera: cameraID, timestamp: time.format('YYYY/MM/DD HH:mm:ss'), condition: condition});
		numFrames++;
	})
	.catch((error) => {
		console.error(error);
	});
}

xbee.on('error', function(err) {
    console.error(err);
    process.exit(1);
});

xbee.on('message_received', function(data) {
	console.log('received a message!');
	console.dir(data);
	var session = data.data[0];
	var condition = data.data[1];
	numFrames = data.data[2] * 256 + data.data[3];
	if (session != sessionID) {
		sessionID = session;
		db = new JSONdb('/home/pi/Documents/TE' + sessionID + '/database', true, false);
	}
	takeFrame(sessionID, condition);
});
