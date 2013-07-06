var _ = require('underscore');
var Response = require('./response');
var Session = require('./session');

//--------------------------------------

var xo = require('./xo')();
var api = require('./api')(xo);

//////////////////////////////////////////////////////////////////////

function json_api_call(session, transport, message)
{
	var req;

	try
	{
		req = JSON.parse(message.toString());
	}
	catch (e)
	{
		if (e instanceof SyntaxError)
		{
			new Response(transport, null).sendError(
				api.err
			);
			return;
		}
	}

	/* jshint laxbreak: true */
	if (!req.method || !req.params
		|| (undefined === req.id)
		|| ('2.0' !== req.jsonrpc))
	{
		new Response(transport, null).sendError(
			-32600,
			'the JSON sent is not a valid request object'
		);
		return;
	}

	api.exec(
		session,
		{
			'method': req.method,
			'params': req.params,
		},
		new Response(transport, req.id)
	);
}

//////////////////////////////////////////////////////////////////////
// JSON-RPC over WebSocket.
//////////////////////////////////////////////////////////////////////

require('socket.io').listen(8080).sockets.on('connection', function (socket) {
	var transport = function (message) {
		socket.send(message);
	};

	var session = new Session();
	session.on('close', function () {
		socket.disconnect();
	});

	socket.on('message', function (message) {
		json_api_call(session, transport, message);
	});
});

//////////////////////////////////////////////////////////////////////
// JSON-RPC over TCP.
//////////////////////////////////////////////////////////////////////

require('net').createServer(function (socket) {
	var transport = function (message) {
		socket.write(message); // @todo Handle long messages.
	};

	var session = new Session();
	session.on('close', function () {
		socket.end(); // @todo Check it is enough.
	});

	var length = null; // Expected message length.
	var buffer = new Buffer();
	socket.on('data', function (data) {
		data.copy(buffer);

		// Read the message length.
		if (!length)
		{
			var i = _.indexOf(buffer, 10);
			if (-1 === i)
			{
				return;
			}

			length = +buffer.toString('ascii', 0, i); // @todo Handle NaN.
			buffer = buffer.slice(i + 1);
		}

		// We do not have received everything.
		if (buffer.length < length)
		{
			return;
		}

		json_api_call(session, transport, buffer.slice(0, length).toString());

		// @todo Check it frees the memory.
		buffer = buffer.slice(length);
	});
}).listen('<path>'); // @todo
