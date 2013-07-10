var _ = require('underscore');
var Q = require('q');
var Session = require('./session');

//--------------------------------------

var xo = require('./xo')();

var Api = require('./api');
var api = new Api(xo);

//////////////////////////////////////////////////////////////////////

function json_api_call(session, message)
{
	/* jshint newcap:false */

	var req = {
		'id': null,
	};

	function format_error(error)
	{
		return JSON.stringify({
			'jsonrpc': '2.0',
			'error': error,
			'id': req.id,
		});
	}

	try
	{
		req = JSON.parse(message.toString());
	}
	catch (e)
	{
		if (e instanceof SyntaxError)
		{
			return Q(format_error(Api.err.INVALID_JSON));
		}
		return Q(format_error(Api.err.SERVER_ERROR));
	}

	/* jshint laxbreak: true */
	if (!req.method || !req.params
		|| (undefined === req.id)
		|| ('2.0' !== req.jsonrpc))
	{
		return Q(format_error(Api.err.INVALID_REQUEST));
	}

	return api.exec(
		session,
		{
			'method': req.method,
			'params': req.params,
		}
	).then(
		function (result) {
			return JSON.stringify({
				'jsonrpc': '2.0',
				'result': result,
				'id': req.id,
			});
		},
		function (error) {
			if (error instanceof Error)
			{
				console.error(error);
				return format_error(Api.err.SERVER_ERROR);
			}

			return format_error(error);
		}
	);
}

//////////////////////////////////////////////////////////////////////
// JSON-RPC over WebSocket.
//////////////////////////////////////////////////////////////////////

 // @todo Port should be configurable.
require('socket.io').listen(8080, {'log level': 0}).sockets
	.on('connection', function (socket) {
		var session = new Session(xo);
		session.once('close', function () {
			socket.disconnect();
		});

		socket.on('message', function (request) {
			json_api_call(session, request).then(function (response) {
				socket.send(response);
			}).done();
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

			length = +buffer.toString('ascii', 0, i);

			// If the length is NaN, we cannot do anything except
			// closing the connection.
			if (length !== length)
			{
				session.close();
				return;
			}

			buffer = buffer.slice(i + 1);
		}

		// We do not have received everything.
		if (buffer.length < length)
		{
			return;
		}

		json_api_call(
			session,
			buffer.slice(0, length).toString()
		).then(function (response) {
			socket.write(response); // @todo Handle long messages.
		}).done();

		// @todo Check it frees the memory.
		buffer = buffer.slice(length);
	});

	// @todo Ugly inter dependency.
	socket.once('close', function () {
		session.close();
	});
}).listen(8081); // @todo Should be configurable.
