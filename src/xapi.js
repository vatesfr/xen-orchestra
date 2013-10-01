var Q = require('q');
var xmlrpc = require('xmlrpc');

Q.longStackSupport = true;

//////////////////////////////////////////////////////////////////////

function Xapi(host)
{
	// Parent constructor.
	Xapi.super_.call(this);

	this.xmlrpc = xmlrpc.createSecureClient({
		hostname: host,
		port: '443',
		rejectUnauthorized: false,
	}); // @todo Handle connection success/error.
}
require('util').inherits(Xapi, require('events').EventEmitter);

Xapi.prototype.call = function (method) {
	var params = Array.prototype.slice.call(arguments, 1);

	if (this.sessionId)
	{
		params.unshift(this.sessionId);
	}

	return Q.ninvoke(this.xmlrpc, 'methodCall', method, params)
		.then(function (value) {
			if ('Success' !== value.Status)
			{
				if ('Failure' === value.Status)
				{
					throw value.ErrorDescription;
				}

				throw value;
			}

			return value.Value;
		});
};

Xapi.prototype.connect = function (username, password) {
	var self = this;

	return this.call('session.login_with_password', username, password)
		.then(function (session_id) {
			console.log(self.xmlrpc.options, session_id);
			self.sessionId = session_id;
		});
};

//////////////////////////////////////////////////////////////////////

module.exports = Xapi;
