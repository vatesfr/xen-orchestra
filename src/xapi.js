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

	this.errors = [];
}
require('util').inherits(Xapi, require('events').EventEmitter);

Xapi.prototype.call = function (method) {
	var params = Array.prototype.slice.call(arguments, 1);

	if (this.sessionId)
	{
		params.unshift(this.sessionId);
	}

	var self = this;
	return Q.ninvoke(this.xmlrpc, 'methodCall', method, params)
		.then(function (value) {
			if ('Success' !== value.Status)
			{
				throw value;
			}

			return value.Value;
		})
		.fail(function (error) {
			self.errors.push(error);
			throw error;
		});
};

Xapi.prototype.connect = function (username, password) {
	var self = this;

	return this.call('session.login_with_password', username, password)
		.then(function (session_id) {
			self.sessionId = session_id;
		});
};

//////////////////////////////////////////////////////////////////////

module.exports = Xapi;
