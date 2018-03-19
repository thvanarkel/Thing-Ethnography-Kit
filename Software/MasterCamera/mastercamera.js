var http = require('http');
var fs = require('fs');
var Xbee = require('digimesh');

var ipaddress = 'localhost';
var port = 8888;

var wss = require('ws').Server;

var server = http.createServer(function(req, res) {
  fs.readFile(__dirname + '/templates/main.html', function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
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
	s.on('message', function(m) {
		console.log('received: %s', m);
		s.send('reply from server : ' + m);
	});
	s.send('something');
});

ws.broadcast = function broadcast(data) {
	ws.clients.forEach(function each(client) {
		console.log(wss.OPEN);
		if (client.readyState === 1) {
			client.send(data);
		}
	});
};

var xbee = new Xbee({ device: '/dev/ttyAMA0', baud: 9600 }, function() {
    console.log('xbee is ready');

    console.log('getting node identifier...');
    // ask for node identifier string
    xbee.get_ni_string(function(err, data) {
        if (err) return console.err(err);
        console.log("my NI is '" + data.ni + "'");
        console.log('scanning for nodes on the network...');
        xbee.discover_nodes(function(err, nodes) {
            if (err) return console.err(err);
            console.log('%d nodes found:', nodes.length);
            console.dir(nodes);
        });
    });
});

xbee.on('error', function(err) {
    console.error(err);
    process.exit(1);
});

xbee.on('message_received', function(data) {
	console.log('received a message!');
	console.dir(data);
	ws.broadcast('{' + data.addr + ', ' + String((data.data[0] * 256) + data.data[1]) + '}');
});
