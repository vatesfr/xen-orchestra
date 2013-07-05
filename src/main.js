var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Session = require('session');

//--------------------------------------

var xo = require('./xo')();
var api = require('./api')(xo);

//////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////

function Response(transport, id)
{
	this.transport = transport;
	this.id = id;
}

Response.prototype.sendResult = function (value)
{
	this.transport(JSON.stringify({
		'jsonrpc': '2.0',
		'result': value,
		'id': this.id,
	}));

	// Prevents results/errors to be sent more than once.
	delete this.transport;
};

Response.prototype.sendError = function (error)
{
	this.transport(JSON.stringify({
		'jsonrpc': '2.0',
		'error': error,
		'id': this.id,
	}));

	// Prevents results/errors to be sent more than once.
	delete this.transport;
};

//////////////////////////////////////////////////////////////////////

function json_api_call(session, transport, message)
{
	try
	{
		var req = JSON.parse(message.toString());
	}
	catch (e if e instanceof SyntaxError)
	{
		new Response(transport, null).sendError(
			api.err
		);
		return;
	}

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
		socket.send(data);
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

		json_api_call(session, transport, buffer.toString());
	});
}).listen('<path>'); // @todo
