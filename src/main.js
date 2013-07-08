var _ = require('underscore');
var Session = require('./session');

//--------------------------------------

var xo = require('./xo')();

var Api = require('./api')(xo);
var api = new Api(xo);

//////////////////////////////////////////////////////////////////////

function json_api_call(session, transport, message)
{
	var req = {
		'id': null,
	};

	function send_error(error)
	{
		transport(JSON.stringify({
			'jsonrpc': '2.0',
			'error': error,
			'id': req.id,
		}));
	}

	try
	{
		req = JSON.parse(message.toString());
	}
	catch (e)
	{
		if (e instanceof SyntaxError)
		{
			send_error(Api.err.INVALID_JSON);
		}
	}

	/* jshint laxbreak: true */
	if (!req.method || !req.params
		|| (undefined === req.id)
		|| ('2.0' !== req.jsonrpc))
	{
		send_error(Api.err.INVALID_REQUEST);
		return;
	}

	api.exec(
		session,
		{
			'method': req.method,
			'params': req.params,
		}
	).then(
		function (result) {
			transport(JSON.stringify({
				'jsonrpc': '2.0',
				'result': result,
				'id': req.id,
			}));
		},
		send_error
	).done();
}

//////////////////////////////////////////////////////////////////////
// JSON-RPC over WebSocket.
//////////////////////////////////////////////////////////////////////

require('socket.io').listen(8080).sockets.on('connection', function (socket) {
	var transport = function (message) {
		socket.send(message);
	};

	var session = new Session();
	session.once('close', function () {
		socket.disconnect();
	});

	socket.on('message', function (message) {
		json_api_call(session, transport, message);
	});

	// @todo Ugly inter dependency.
	socket.once('disconnect', function () {
		session.close();
	});
});

//////////////////////////////////////////////////////////////////////
// JSON-RPC over TCP.
//////////////////////////////////////////////////////////////////////

require('net').createServer(function (socket) {
	var transport = function (message) {
		socket.write(message); // @todo Handle long messages.
	};

	var session = new Session(xo);
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

	// @todo Ugly inter dependency.
	socket.once('close', function () {
		session.close();
	});
}).listen('<path>'); // @todo
