var http = require('http');

var ipaddress = 'localhost';
var port = 8888;

var server = http.createServer(function(req, res) {
	res.writeHead(200);
	res.end('Running..');
});
server.listen(port, function() {
	console.log((new Date()) + 'Server is listening on port ' + port);
});
