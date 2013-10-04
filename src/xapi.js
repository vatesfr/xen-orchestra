var Q = require('q');
var xmlrpc = require('xmlrpc');

Q.longStackSupport = true;

//////////////////////////////////////////////////////////////////////

function Xapi(host, username, password)
{
	// Parent constructor.
	Xapi.super_.call(this);

	this.username = username;
	this.password = password;

	this.changeHost(host);
}
require('util').inherits(Xapi, require('events').EventEmitter);

Xapi.prototype.call = function (method) {
	var args = arguments;
	var current; // Error code.

	var self = this;
	return function helper() {
		return Q(self.sessionId).then(function (session_id) {
			var params = Array.prototype.slice.call(args, 1);
			if (session_id)
			{
				params.unshift(session_id);
			}

			return Q.ninvoke(self.xmlrpc, 'methodCall', method, params);
		}).then(function (value) {
			if ('Success' !== value.Status)
			{
				if ('Failure' === value.Status)
				{
					throw value.ErrorDescription;
				}

				throw value;
			}

			return value.Value;
		}).fail(function (error) {

			// Gets the error code for transport errors and XAPI errors.
			current = error.code || error[0];

			// XAPI sommetimes close the connection when the server is
			// no longer pool master (`event.next`), so we have to
			// retry at least once to know who is the new pool master.
			if (('ECONNRESET' === current)
				|| ('ECONNREFUSED' === current) // More or less similar to above.
				|| ('HOST_STILL_BOOTING' === current)
				|| ('HOST_HAS_NO_MANAGEMENT_IP' === current)) // Similar to above.
			{
				// Node.js seems to reuse the broken socket, so we add
				// a small delay.

				// @todo Add a limit to avoid trying indefinitely.

				return Q.delay(1000).then(helper);
			}

			// XAPI is sometimes reinitialized and sessions are lost.
			// We try log in again if necessary.
			if ('SESSION_INVALID' === current)
			{
				self.logIn();
				return helper();
			}

			if ('HOST_IS_SLAVE' === current)
			{
				self.changeHost(error[1]);
				return helper();
			}

			throw error;
		});
	}();
};

Xapi.prototype.changeHost = function (host) {
	if (this.host === host)
	{
		return;
	}

	if (this.host)
	{
		console.log('changing host from '+ this.host +' to '+ host);
	}

	this.host = host;
	this.xmlrpc = xmlrpc.createSecureClient({
		hostname: host,
		port: '443',
		rejectUnauthorized: false,
	}); // @todo Handle connection success/error.

	this.logIn();
};

Xapi.prototype.logIn = function () {
	var self = this;
	self.sessionId = undefined;
	self.sessionId = self.call(
		'session.login_with_password',
		self.username,
		self.password
	).then(function (session_id) {
		self.sessionId = session_id;

		return session_id;
	});

	return self.sessionId;
};

//////////////////////////////////////////////////////////////////////

module.exports = Xapi;
