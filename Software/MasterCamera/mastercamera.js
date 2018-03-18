var http = require('http').createServer(handler);
var fs = require('fs');
var Xbee = require('digimesh');

http.listen(8888);

function handler(req, res) {
  fs.readFile(__dirname + '/templates/main.html', function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    return res.end();
  })
}

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
});
