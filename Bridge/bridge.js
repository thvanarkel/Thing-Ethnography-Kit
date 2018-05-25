// Variables
let cameraTimeout = 20000; // Set the delay between consecutive pictures
let sessionID = 6; // Set the ID for this session, preferably increment after each study



var http = require('http');
var fs = require('fs');
var url = require('url');
var Xbee = require('digimesh');
let moment = require('moment');
let JSONdb = require('node-json-db');

var port = 8888;
var wss = require('ws').Server;

/*
 *  Settings for the camera. Make sure the timeout is set to a value.
 */
var photosTaken = 0;
var takingPicture = false;
var PiCamera = require('pi-camera');
let camera = new PiCamera({
  mode: 'photo',
  output: __dirname + '/test.jpg',
  width: 1296,
  height: 972,
  nopreview: true,
	timeout: 100,
});

var hasCamera = true;
var cameraID;
var numFrames = 0;

// Instantiates the database for logging timestamps and sensor values
var db = new JSONdb('/home/pi/Documents/TE' + sessionID + '/database', true, true);

// Contains all nodes in the network
var network;
// Contains all cameras connected to the network
// Data format: [xbee address, time last photo taken]
var cameras = [];
// Contains all sensors connected to the network
// Data format: [xbee address, last sensor value]
var sensors = [];

/*
 *  Creates the server, and the interface for introspecting the sensor values
 */
var server = http.createServer(function(req, res) {
  fs.readFile(__dirname + '/templates/main.html', function(err, data) {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/html'
      });
      return res.end("404 Not Found");
    }
    var request = url.parse(req.url, true);
    console.log(request.pathname);
    if (request.pathname.includes('/images/image')) {
      console.log('load image');
      var img = fs.readFileSync('./static' + request.pathname);
      res.writeHead(200, {
        'Content-Type': 'image/jpg'
      });
      res.end(img, 'binary');
    } else {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.write(data);
    }
    return res.end();
  })
});

// Start the server
server.listen(port, function() {
  console.log((new Date()) + 'Server is listening on port ' + port);
});

// Instantiate a websocket connection with potentially connected clients
// (interfaces for introspection)
var ws = new wss({
  server: server
});

/*
 *  Upon connection
 */
ws.on('connection', function(s) {
  console.log('New connection');
  // Send the current network of sensors to the interface
  var m = {
    type: 'network',
    payload: {
      nodes: network
    }
  }
  ws.broadcast(JSON.stringify(m));
  // Reload the network when the reload button in the interface is pressed
  ws.on('message', function(m) {
    console.log('received: %s', m);
    if (m === 'reload') {
      scanNetwork();
    }
  });
});

// Function that broadcasts messages to all connected (interface) clients
ws.broadcast = function broadcast(data) {
  ws.clients.forEach(function each(client) {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

// Instantiate the xbee (which is connected to this Raspberry Pi)
var xbee = new Xbee({
  device: '/dev/ttyAMA0',
  baud: 9600
}, function() {
  console.log('xbee is ready');

  console.log('getting node identifier...');
  // ask for node identifier string
  xbee.get_ni_string(function(err, data) {
    if (err) return console.err(err);
    console.log("my NI is '" + data.ni + "'");
    // Use the connected Xbee to scan for other nodes in the network
    scanNetwork();
  });
});

// Scans the network for sensor nodes and cameras, adds them to the
// respective data models.
var scanNetwork = function() {
  console.log('scanning for nodes on the network...');
  xbee.discover_nodes(function(err, nodes) {
    if (err) return console.err(err);
    console.log('%d nodes found:', nodes.length);
    console.dir(nodes);
    //Send an overview of the connected nodes to the interface
    var m = {
      type: 'network',
      payload: {
        nodes: nodes
      }
    }
    ws.broadcast(JSON.stringify(m));

    network = nodes;
    // Clear all previous values
    cameras = [];
    sensors = [];
    // If this Raspberry Pi has a camera, add it's Xbee address to
    // the camera array
    if (hasCamera) {
      cameras.push({
        address: xbee.address,
        lastTaken: (Date.now() - cameraTimeout)
      });
    }

    for (let node of nodes) {
      // If the Node Identifier contains Camera, add it's Xbee address
      // to the camera array
      if (node.ni_string.indexOf('Camera') != -1) {
        var aCamera = {
          address: node.addr,
          lastTaken: (Date.now() - cameraTimeout)
        };
        cameras.push(aCamera);
      // If the Node Identifier contains Sensor, add it's Xbee address
      // to the sensor array
      } else if (node.ni_string.indexOf('Sensor') != -1) {
        var aSensor = {
          address: node.addr,
          value: 0
        };
        sensors.push(aSensor);
      }
    }
    console.log(cameras);

  });
}

// Check whether a picture should be taken
var evaluateConditions = function() {
  // List of sensors in the system
  var sensor1 = sensorWithID('0013a200408b7976');
  var sensor2 = sensorWithID('0013a20040eae3c4');
  var sensor3 = sensorWithID('0013a20040bbefc9');

  var camera = null;
  var condition = null;

  // If the sensor value exceeds a certain value, and a picture was not taken
  // within the timeout, take a new picture.
  if (sensor1) {
    if (sensor1.value > 300) {
      // Specify which camera should take a picture
      // 0 is the current camera if this rpi has a camera
      camera = cameras[0];
      // Condition label for reference
      condition = 1;
      if (Date.now() > (camera.lastTaken + cameraTimeout)) {
        captureFrame(camera, condition);
        camera.lastTaken = Date.now();
      }
    }
	}
	if (sensor2) {
    if (sensor2.value > 250) {
      camera = cameras[0];
      condition = 2;
      if (Date.now() > (camera.lastTaken + cameraTimeout)) {
        captureFrame(camera, condition);
        camera.lastTaken = Date.now();
      }
    }
	}
	if (sensor3) {
    if (sensor3.value > 200) {
      camera = cameras[0];
      condition = 3;
      if (Date.now() > (camera.lastTaken + cameraTimeout)) {
        captureFrame(camera, condition);
        camera.lastTaken = Date.now();

      }
    }
  }
}

// Evaluates which camera should take a picture
var captureFrame = function(camera, condition) {
  if (hasCamera) {
    if (camera.address === xbee.address) {
      // Take a picture here
      takeFrame(sessionID, camera.address, condition, sensors);
    } else {
      // Prepare data with sessionID, condition and number of frames
      data = [sessionID,
        condition,
        (numFrames & 0x0000ff00) >> 8,
        (numFrames & 0x000000ff)
      ];
      console.log(new Buffer(data));
      // Send message to other camera to take a picture
      xbee.send_message({
        data: new Buffer(data),
        addr: camera.address,
        broadcast: false
      });
    }
    numFrames++;
  }

}

// Takes a picture, and logs the metadata in the database
// Parameters
// session: the ID of the session
// cameraID: the xbee address of the camera that took the picture
// condition: label to identify which satisfied condition triggered the picture
// sensors: array of all sensors and their corresponding values at the time of the picture
var takeFrame = function(session, cameraID, condition, sensors) {
  // Create the filename for the photo
  var path = '/home/pi/Documents/TE' + session;
  makePath(path);
  path += '/frames';
  makePath(path);
  var time = moment();
  var time_format = time.format('YYYY.MM.DD.HH.mm.ss');
  var filename = '/frame' + numFrames + '.' + time_format + '.jpg';
  path += filename;
  camera.set('output', path);
  // Take the picture
  camera.snap()
    .then((result) => {
      console.dir(result);
      console.log('snapped picture');
      // Push an entry to the database
      db.push('/frame' + numFrames, {
        camera: cameraID,
        timestamp: time.format('YYYY/MM/DD HH:mm:ss'),
        condition: condition,
				sensors: sensors
      });
    })
    .catch((error) => {
      console.error(error);
    });
}

xbee.on('error', function(err) {
  console.error(err);
  process.exit(1);
});


// When the Xbee receives a message, read the value and update
// the corresponding sensor's value in the interface
xbee.on('message_received', function(data) {
  // Because the value can be greater than a byte, the data is split in two bytes
  var v = (data.data[0] * 256) + data.data[1];
  // Prepare a message for an update to the interface
  var m = {
    type: 'update',
    payload: {
      address: data.addr,
      value: v
    }
  };
  // Update the sensor's value
  for (let sensor of sensors) {
    if (sensor.address === data.addr) {
      sensor.value = v;
    }
  }
  ws.broadcast(JSON.stringify(m));
  // Check whether the system needs to take a picture
  evaluateConditions();
});

// When a new Xbee joins the system, reload the network
xbee.on('xbee_joined', function(data) {
  console.log("Rescan network");
  scanNetwork();
});

// Utility function to retrieve the sensor with its
var sensorWithID = function(id) {
  return sensors.filter(function(s) {
    return s.address == id;
  })[0];
}


// Creates a directory if it does not exist yet
var makePath = function(path) {
  fs.mkdir(path, function(err) {
    if (err) {
      if (err.code = 'EEXIST');
    } else {
      console.log('made dir');
    }
  });
}
