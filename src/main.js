//////////////////////////////////////////////////////////////////////

var xo = {};
var api = require('./api')(xo);

//////////////////////////////////////////////////////////////////////

require('socket.io')
	.listen(8080)
	.sockets.on('connection', function (socket) {

		// When a message is received.
		socket.on('message', function () {});
	})
;




var json_rpc = require('./json-rpc');


