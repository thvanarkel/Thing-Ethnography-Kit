var http = require('http').createServer(handler);
var fs = require('fs');

http.listen(8080);

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

var xbee = new Xbee({ device: '/dev/ttyU0', baud: 115200 }, function() {
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

            // if we found anyone
            if (nodes.length) {
                console.log("saying 'hello' to node %s...", nodes[0].addr);
                xbee.send_message({
                    data: new Buffer("hello"),
                    addr: nodes[0].addr,
                    broadcast: false,
                },
                // callback
                function(err, data) {
                    if (err) return console.error(err);
                    // print the string status message for the status we got back
                    console.log('delivery status: %s',
                        xbee.DELIVERY_STATUS_STRINGS[data.status]);
                    console.dir(data);
                    console.log('goodbye');
                    process.exit(0);
                });
            }
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
