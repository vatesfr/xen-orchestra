var _ = require('underscore');
var Q = require('q');

//////////////////////////////////////////////////////////////////////

function deprecated(fn)
{
	return function (session, req) {
		console.warn(req.method +' is deprecated!');

		return fn.apply(this, arguments);
	};
}

//////////////////////////////////////////////////////////////////////

function Api(xo)
{
	if ( !(this instanceof Api) )
	{
		return new Api(xo);
	}

	this.xo = xo;
}

Api.prototype.exec = function (session, request) {
	/* jshint newcap: false */

	var method = this.getMethod(request.method);

	if (!method)
	{
		return Q.reject(Api.err.INVALID_METHOD);
	}

	try
	{
		return Q(method.call(this.xo, session, request));
	}
	catch (e)
	{
		return Q.reject(e);
	}
};

Api.prototype.getMethod = function (name) {
	/* jshint noempty: false */

	var parts = name.split('.');

	var current = Api.fn;
	for (
		var i = 0, n = parts.length;
		(i < n) && (current = current[parts[i]]);
		++i
	)
	{}

	// Method found.
	if (_.isFunction(current))
	{
		return current;
	}

	// It's a (deprecated) alias.
	if (_.isString(current))
	{
		return deprecated(this.getMethod(current));
	}

	return undefined;
};

module.exports = Api;

//////////////////////////////////////////////////////////////////////

function err(code, message)
{
	return {
		'code': code,
		'message': message
	};
}

Api.err = {

	//////////////////////////////////////////////////////////////////
	// JSON-RPC errors.
	//////////////////////////////////////////////////////////////////

	'INVALID_JSON': err(-32700, 'invalid JSON'),

	'INVALID_REQUEST': err(-32600, 'invalid JSON-RPC request'),

	'INVALID_METHOD': err(-32601, 'method not found'),

	'INVALID_PARAMS': err(-32602, 'invalid parameter(s)'),

	'SERVER_ERROR': err(-32603, 'unknown error from the server'),

	//////////////////////////////////////////////////////////////////
	// XO errors.
	//////////////////////////////////////////////////////////////////

	'NOT_IMPLEMENTED': err(0, 'not implemented'),

	'NO_SUCH_OBJECT': err(1, 'no such object'),

	// Not authenticated or not enough permissions.
	'UNAUTHORIZED': err(2, 'not authenticated or not enough permissions'),

	// Invalid email & passwords or token.
	'INVALID_CREDENTIAL': err(3, 'invalid credential'),

	'ALREADY_AUTHENTICATED': err(4, 'already authenticated'),
};

//////////////////////////////////////////////////////////////////////

// Helper functions that should be written:
// - checkParams(req.params, param1, ..., paramN).then(...)
// - isAuthorized(session, [permission]).then(...)

Api.fn  = {};

Api.fn.api = {
	'getVersion' : function () {
		return '0.1';
	},
};

// Session management
Api.fn.session = {
	'signInWithPassword': function (session, req) {
		var p_email = req.params.email;
		var p_pass = req.params.password;

		if (!p_email || !p_pass)
		{
			throw Api.err.INVALID_PARAMS;
		}

		if (session.has('user_id'))
		{
			throw Api.err.ALREADY_AUTHENTICATED;
		}

		return this.users.findWhere({'email': p_email}).then(function (user) {
			if (!user)
			{
				throw Api.err.INVALID_CREDENTIAL;
			}

			return user.checkPassword(p_pass).then(function (success) {
				if (!success)
				{
					throw Api.err.INVALID_CREDENTIAL;
				}

				session.set('user_id', user.get('id'));
				return true;
			});
		});
	},

	'signInWithToken': function (session, req) {
		var p_token = req.params.token;

		if (!p_token)
		{
			throw Api.err.INVALID_PARAMS;
		}

		if (session.has('user_id'))
		{
			throw Api.err.ALREADY_AUTHENTICATED;
		}

		return this.tokens.get(p_token).then(function (token) {
			if (!token)
			{
				throw Api.err.INVALID_CREDENTIAL;
			}

			session.set('token_id', token.get('id'));
			session.set('user_id', token.get('user_id'));
			return true;

		});
	},

	'getUser': deprecated(function (session) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			return null;
		}

		return this.users.get(user_id).then(function (user) {
			return _.pick(user.properties, 'id', 'email');
		});
	}),

	'getUserId': function (session) {
		return session.get('user_id', null);
	},

	'createToken': 'token.create',

	'destroyToken': 'token.delete',
};

// User management.
Api.fn.user = {
	'create': function (session, req) {
		var p_email = req.params.email;
		var p_pass = req.params.password;
		var p_perm = req.params.permission;

		if (!p_email || !p_pass)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var users = this.users;
		return users.get(user_id).then(function (user) {
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			return users.create(p_email, p_pass, p_perm);
		}).then(function (user) {
			return (''+ user.get('id'));
		});
	},

	'delete': function (session, req) {
		var p_id = req.params.id;
		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var users = this.users;
		return users.get(user_id).then(function (user) {
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			return users.remove(p_id).then(function (success) {
				if (!success)
				{
					throw Api.err.NO_SUCH_OBJECT;
				}

				return true;
			});
		});
	},

	'changePassword': function (session, req) {
		var p_old = req.params.old;
		var p_new = req.params['new'];
		if ((undefined === p_old) || (undefined === p_new))
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var user;
		var users = this.users;
		return users.get(user_id).then(function (u) {
			user = u;

			return user.checkPassword(p_old);
		}).then(function (success) {
			if (!success)
			{
				throw Api.err.INVALID_CREDENTIAL;
			}

			return user.setPassword(p_new);
		}).then(function () {
			/* jshint newcap:false */
			return users.update(user).thenResolve(true);
		});
	},

	'getAll': function (session) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var users = this.users;
		return users.get(user_id).then(function (user) {
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			return users.where();
		}).then(function (all_users) {
			_.each(all_users, function (user, i) {
				all_users[i] = _.pick(user, 'id', 'email', 'permission');
			});

			return all_users;
		});
	},

	'set': function (session, request) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var p_email, p_password, p_permission;

		var users = this.users;

		return users.get(user_id).then(function (user) {
			// Get the current user to check its permission.

			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			var p_id = request.params.id;
			p_email = request.params.email;
			p_password = request.params.password;
			p_permission = request.params.permission;

			/* jshint laxbreak: true */
			if ((undefined === p_id)
				|| ((undefined === p_email)
					&& (undefined === p_password)
					&& (undefined === p_permission)))
			{
				throw Api.err.INVALID_PARAMS;
			}

			// @todo Check there are no invalid parameter.

			return users.get(p_id);
		}).then(function (user) {
			// @todo Check user exists.

			// Gets the user to update.

			// @todo Check undefined value are ignored.
			user.set({
				'email': p_email,
				'permission': p_permission,
			});

			if (p_password)
			{
				return user.setPassword(p_password).then(user);
			}

			return user;
		}).then(function (user) {
			// Save the updated user.

			return users.update(user);
		}).thenResolve(true).fail(function () {
			throw Api.err.INVALID_PARAMS;
		});
	},
};

// Token management.
Api.fn.token = {
	'create': function (session) {
		var user_id = session.get('user_id');
		/* jshint laxbreak: true */
		if ((undefined === user_id)
			|| session.has('token_id'))
		{
			throw Api.err.UNAUTHORIZED;
		}

		// @todo Token permission.

		return this.tokens.generate(user_id).then(function (token) {
			return token.get('id');
		});
	},

	'delete': function (session, req) {
		var p_token = req.params.token;

		var tokens = this.tokens;
		return tokens.get(p_token).then(function (token) {
			if (!token)
			{
				throw Api.err.INVALID_PARAMS;
			}

			// @todo Returns NO_SUCH_OBJECT if the token does not exists.
			/* jshint newcap:false */
			return tokens.remove(p_token).thenResolve(true);
		});
	},
};

// Pool management.
Api.fn.server = {
	'add': function (session, req) {
		var p_host = req.params.host;
		var p_username = req.params.username;
		var p_password = req.params.password;

		if (!p_host || !p_username || !p_password)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var servers = this.servers;
		return this.users.get(user_id).then(function (user) {
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			// @todo We are storing passwords which is bad!
			// Can we use tokens instead?
			return servers.add({
				'host': p_host,
				'username': p_username,
				'password': p_password,
			});
		}).then(function (server) {
			// @todo Connect the server.

			return (''+ server.get('id'));
		});
	},

	'remove': function (session, req) {
		var p_id = req.params.id;

		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var servers = this.servers;
		return this.users.get(user_id).then(function (user) {
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			return servers.remove(p_id);
		}).then(function(success) {
			if (!success)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			return true;
		});
	},

	'getAll': function (session) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var servers = this.servers;
		return this.users.get(user_id).then(function (user) {
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}

			return servers.where();
		}).then(function (all_servers) {
			_.each(all_servers, function (server, i) {
				all_servers[i] = _.pick(server, 'id', 'host', 'username');
			});

			return all_servers;
		});
	},

	'connect': function () {
		throw Api.err.NOT_IMPLEMENTED;
	},

	'disconnect': function () {
		throw Api.err.NOT_IMPLEMENTED;
	},
};
