var events = require('events');
var util = require('util');

//--------------------------------------

var xo = require('./xo')();
var api = require('./api')(xo);

//////////////////////////////////////////////////////////////////////

function Session()
{
	this.data = {};
}

util.inherits(Session, events.EventEmitter);

Session.prototype.close = function () {
	session.emit('close');
};

Session.prototype.get = function (name, def) {
	if (undefined !== this.data[name])
	{
		return this.data[name];
	}

	return def;
};

Session.prototype.has = function (name) {
	return (undefined !== this.data[name]);
};

Session.prototype.set = function (name, value) {
	this.data[name] = value;
};

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

require('socket.io')
	.listen(8080)
	.sockets.on('connection', function (socket) {

		// @todo comment
		var transport = function (message) {
			socket.send(data);
		};

		var session = new Session();
		session.on('close', function () {
			socket.disconnect();
		});

		// When a message is received.
		socket.on('message', function (message) {
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
		});
	})
;
