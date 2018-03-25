var http = require('http');
var fs = require('fs');
var Xbee = require('digimesh');




var ipaddress = 'localhost';
var port = 8888;

var server = http.createServer(function(req, res) {
	res.writeHead(200);
	res.end('Running..');
});
server.listen(port, function() {
	console.log((new Date()) + 'Server is listening on port ' + port);
});

var xbee = new Xbee({ device: '/dev/ttyAMA0', baud: 9600 }, function() {
    console.log('xbee is ready');

    console.log('getting node identifier...');
    // ask for node identifier string
    xbee.get_ni_string(function(err, data) {
        if (err) return console.err(err);
        console.log("my NI is '" + data.ni + "'");
    });
});
