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

module.exports = Response;
