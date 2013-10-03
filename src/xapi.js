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
	var tries = 0;

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

			// XAPI sommetimes close the connection when the server is
			// no longer pool master (`event.next`), so we have to
			// retry at least once to know who is the new pool master.
			if ((0 === tries) && ('ECONNRESET' === error.code))
			{
				// @todo Does not work because it seems to reuse the
				// broken socket.

				++tries;
				return helper();
			}

			if ('HOST_IS_SLAVE' === error[0])
			{
				tries = 0;
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

	this.host = host;
	this.xmlrpc = xmlrpc.createSecureClient({
		hostname: host,
		port: '443',
		rejectUnauthorized: false,
	}); // @todo Handle connection success/error.

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
