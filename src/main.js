var _ = require('underscore');
var connect = require('connect');
var Q = require('q');
var Session = require('./session');
var tcp = require('net');
var WSServer = require('ws').Server;

//--------------------------------------

var xo = require('./xo')();

var Api = require('./api');
var api = new Api(xo);

// @todo Port should be configurable.
var http_serv = require('http').createServer().listen(8080).on('listening', function () {
	console.log('XO-Server Web server is listening on port '+ 8080 +'.');
});

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
				console.error(error.stack);
				return format_error(Api.err.SERVER_ERROR);
			}

			return format_error(error);
		}
	);
}

//////////////////////////////////////////////////////////////////////
// Static file serving (for XO-Web for instance).
//////////////////////////////////////////////////////////////////////

xo.on('started', function () {
	http_serv.on('request', connect()
		// Compresses reponses using GZip.
		.use(connect.compress())

		// Caches the responses in memory.
		//.use(connect.staticCache())

		// Serve static files.
		.use(connect.static(__dirname +'/../public/http'))
	);
});

//////////////////////////////////////////////////////////////////////
// WebSocket to TCP proxy (used for consoles).
//////////////////////////////////////////////////////////////////////

// Protocol:
//
// 1. The web browser connects to the server via WebSocket.
//
// 2. It sends a first message containing the “host” and “port” to
//    connect to in a JSON object.
//
// 3. All messages to send to the TCP server and received from it will
//    be encoded using Base64.

// @todo Avoid Base64 encoding and directly use binary streams.
// xo.on('started', function () {
// 	var server = new WSServer({
// 		'server': http_serv,
// 		'path': '/websockify',
// 	});

// 	server.on('connection', function (socket) {
// 		// Parses the first message which SHOULD contains the host and
// 		// port of the host to connect to.
// 		socket.once('message', function (message) {
// 			try
// 			{
// 				message = JSON.parse(message);
// 			}
// 			catch (e)
// 			{
// 				socket.close();
// 				return;
// 			}

// 			if (!message.host && !message.port)
// 			{
// 				socket.close();
// 				return;
// 			}

// 			var target = tcp.createConnection(message.port, message.host);
// 			target.on('data', function (data) {
// 				socket.send(data.toString('base64'));
// 			});
// 			target.on('end', function () {
// 				socket.close();
// 			});
// 			target.on('error', function () {
// 				target.end();
// 			});

// 			socket.on('message', function (message) {
// 				target.write(new Buffer(message, 'base64'));
// 			});
// 			socket.on('close', function () {
// 				target.end();
// 			});
// 		});

// 		socket.on('error', function () {
// 			socket.close();
// 		});
// 	});
// });

//////////////////////////////////////////////////////////////////////
// JSON-RPC over WebSocket.
//////////////////////////////////////////////////////////////////////

xo.on('started', function () {
	var server = new WSServer({
		'server': http_serv,
		'path': '/api/',
	});

	server.on('connection', function (socket) {
		var session = new Session(xo);
		session.once('close', function () {
			socket.close();
		});

		socket.on('message', function (request) {
			json_api_call(session, request).then(function (response) {
				// Send response if session still open.
				if (socket.readyState === socket.OPEN)
				{
					socket.send(response);
				}
			}).done();
		});

		// @todo Ugly inter dependency.
		socket.once('close', function () {
			session.close();
		});
	});
});

//////////////////////////////////////////////////////////////////////
// JSON-RPC over TCP.
//////////////////////////////////////////////////////////////////////

// xo.on('started', function () {
// 	require('net').createServer(function (socket) {
// 		var session = new Session(xo);
// 		session.on('close', function () {
// 			socket.end(); // @todo Check it is enough.
// 		});

// 		var length = null; // Expected message length.
// 		var buffer = new Buffer(1024); // @todo I hate hardcoded values!
// 		socket.on('data', function (data) {
// 			data.copy(buffer);

// 			// Read the message length.
// 			if (!length)
// 			{
// 				var i = _.indexOf(buffer, 10);
// 				if (-1 === i)
// 				{
// 					return;
// 				}

// 				length = +(buffer.toString('ascii', 0, i));

// 				// If the length is NaN, we cannot do anything except
// 				// closing the connection.
// 				if (length !== length)
// 				{
// 					session.close();
// 					return;
// 				}

// 				buffer = buffer.slice(i + 1);
// 			}

// 			// We do not have received everything.
// 			if (buffer.length < length)
// 			{
// 				return;
// 			}

// 			json_api_call(
// 				session,
// 				buffer.slice(0, length).toString()
// 			).then(function (response) {
// 				// @todo Handle long messages.
// 				socket.write(response.length +'\n'+ response);
// 			}).done();

// 			// @todo Check it frees the memory.
// 			buffer = buffer.slice(length);

// 			length = null;
// 		});

// 		// @todo Ugly inter dependency.
// 		socket.once('close', function () {
// 			session.close();
// 		});
// 	}).listen(1024); // @todo Should be configurable.
// });

//////////////////////////////////////////////////////////////////////

xo.start();
