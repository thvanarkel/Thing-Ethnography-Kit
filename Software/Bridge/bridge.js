var http = require('http');
var fs = require('fs');
var url = require('url');
var Xbee = require('digimesh');
let moment = require('moment');
let JSONdb = require('node-json-db');

var ipaddress = '192.168.1.144';
var port = 8888;

var wss = require('ws').Server;

var photosTaken = 0;
var takingPicture = false;
var PiCamera = require('pi-camera');
let camera = new PiCamera({
  mode: 'photo',
  output: __dirname + '/test.jpg',
  width: 1296,
  height: 972,
  timeout: 100,
  ifx: 'blur',
  nopreview: true
});

var hasCamera = true;

var cameraID;
var cameraTimeout = 20000;
var sessionID = 6;
var numFrames = 0;

var db = new JSONdb('/home/pi/Documents/TE' + sessionID + '/database', true, true);



var network;
var cameras = [];
var sensors = [];

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

server.listen(port, function() {
  console.log((new Date()) + 'Server is listening on port ' + port);
});

var ws = new wss({
  server: server
});

ws.on('connection', function(s) {
  console.log('New connection');

  var m = {
    type: 'network',
    payload: {
      nodes: network
    }
  }
  ws.broadcast(JSON.stringify(m));
  var m = {
    type: 'snapshot',
    payload: {
      photosTaken: photosTaken
    }
  }
  ws.broadcast(JSON.stringify(m));
  s.on('message', function(m) {
    console.log('received: %s', m);
    if (m === 'reload') {
      scanNetwork();
    } else if (m === 'frame') {
      takeSnapshot();
    }
  });
});

ws.broadcast = function broadcast(data) {
  ws.clients.forEach(function each(client) {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

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
    scanNetwork();
  });
});

var scanNetwork = function() {
  console.log('scanning for nodes on the network...');
  xbee.discover_nodes(function(err, nodes) {
    if (err) return console.err(err);
    console.log('%d nodes found:', nodes.length);
    console.dir(nodes);

    var m = {
      type: 'network',
      payload: {
        nodes: nodes
      }
    }
    ws.broadcast(JSON.stringify(m));
    network = nodes;
    cameras = [];
    sensors = [];
    if (hasCamera) {
      cameras.push({
        address: xbee.address,
        lastTaken: (Date.now() - cameraTimeout)
      });
    }

    for (let node of nodes) {
      if (node.ni_string.indexOf('Camera') != -1) {
        var aCamera = {
          address: node.addr,
          lastTaken: (Date.now() - cameraTimeout)
        };
        cameras.push(aCamera);
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

var takeSnapshot = function() {
  if (takingPicture) {
    return;
  }
  takingPicture = true;
  camera.set('output', __dirname + '/static/images/image' + photosTaken + '.jpg');
  camera.snap()
    .then((result) => {
      photosTaken++;
      console.log('Photo taken');
      var m = {
        type: 'frame',
        payload: {
          photosTaken: photosTaken
        }
      }
      ws.broadcast(JSON.stringify(m));
      takingPicture = false;
    })
    .catch((error) => {
      console.error(error);
    });
}

var makePath = function(path) {
  fs.mkdir(path, function(err) {
    if (err) {
      if (err.code = 'EEXIST');
    } else {
      console.log('made dir');
    }
  });
}

var takeFrame = function(session, cameraID, condition, sensors) {
  var path = '/home/pi/Documents/TE' + session;
  makePath(path);
  path += '/frames';
  makePath(path);
  var time = moment();
  var time_format = time.format('YYYY.MM.DD.HH.mm.ss');
  var filename = '/frame' + numFrames + '.' + time_format + '.jpg';
  path += filename;
  camera.set('output', path);
  camera.snap()
    .then((result) => {
      console.dir(result);
      console.log('snapped picture');
      db.push('/frame' + numFrames, {
        camera: cameraID,
        timestamp: time.format('YYYY/MM/DD HH:mm:ss'),
        condition: condition,
				sensors: sensors
      });
      //var m = {
      //type: 'frame',
      //payload: {
      //photosTaken: photosTaken
      //}
      //}
      //ws.broadcast(JSON.stringify(m));
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
  //console.log('received a message!');
  //console.dir(data);
  var v = (data.data[0] * 256) + data.data[1];
  var m = {
    type: 'update',
    payload: {
      address: data.addr,
      value: v
    }
  };
  for (let sensor of sensors) {
    if (sensor.address === data.addr) {
      sensor.value = v;
    }
  }
  ws.broadcast(JSON.stringify(m));
  evaluateConditions();
});

xbee.on('xbee_joined', function(data) {
  console.log("Rescan network");
  scanNetwork();
});

var sensorWithID = function(id) {
  return sensors.filter(function(s) {
    return s.address == id;
  })[0];
}

var captureFrame = function(camera, condition) {
  if (hasCamera) {
    if (camera.address === xbee.address) {
      takeFrame(sessionID, camera.address, condition, sensors);
    } else {
      data = [sessionID,
        condition,
        (numFrames & 0x0000ff00) >> 8,
        (numFrames & 0x000000ff)
      ];
      console.log(new Buffer(data));
      xbee.send_message({
        data: new Buffer(data),
        addr: camera.address,
        broadcast: false
      });
    }
    numFrames++;
  }

}

var evaluateConditions = function() {
  var sensor1 = sensorWithID('0013a200408b7976');
  var sensor2 = sensorWithID('0013a20040eae3c4');
  var sensor3 = sensorWithID('0013a20040bbefc9');

  var camera = null;
  var condition = null;

  if (sensor1) {
    if (sensor1.value > 300) {
      console.log('is hirgh');
      camera = cameras[0];
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

  //if (sensor

  //if (sensors.find(s => s.address === '0013a200408b7976').value > 500) {
  //console.log('is high');
  //}
}
