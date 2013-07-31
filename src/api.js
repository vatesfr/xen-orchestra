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
		console.warn('Invalid method: '+ request.method);
		return Q.reject(Api.err.INVALID_METHOD);
	}

	try
	{
		return Q(method.call(this, session, request));
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

	// No entry found, looking for a catch-all method.
	current = Api.fn;
	var catch_all;
	for (i = 0; (i < n) && (current = current[parts[i]]); ++i)
	{
		catch_all = current.__catchAll || catch_all;
	}

	return catch_all;
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
// - checkPermission(xo, session, [permission]).then(...)

// @todo Put helpers in their own namespace.
Api.prototype.checkPermission = function (session, permission)
{
	// @todo Handle token permission.

	var user_id = session.get('user_id');

	if (undefined === user_id)
	{
		return Q.reject(Api.err.UNAUTHORIZED);
	}

	if (!permission)
	{
		/* jshint newcap: false */
		return Q();
	}

	return this.xo.users.first(user_id).then(function (user) {
		if (!user.hasPermission(permission))
		{
			throw Api.err.UNAUTHORIZED;
		}
	});
};

//////////////////////////////////////////////////////////////////////

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

		return this.xo.users.first({'email': p_email}).then(function (user) {
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

		return this.xo.tokens.first(p_token).then(function (token) {
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

		return this.xo.users.first(user_id).then(function (user) {
			return _.pick(user.properties, 'id', 'email', 'permission');
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

		var users =  this.xo.users;
		return this.checkPermission(session, 'admin').then(function () {
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

		var users =  this.xo.users;
		return this.checkPermission(session, 'admin').then(function () {
			return users.remove(p_id);
		}).then(function (success) {
			if (!success)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			return true;
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
		var users = this.xo.users;
		return users.first(user_id).then(function (u) {
			user = u;

			return user.checkPassword(p_old);
		}).then(function (success) {
			if (!success)
			{
				throw Api.err.INVALID_CREDENTIAL;
			}

			return user.setPassword(p_new);
		}).then(function () {
			return users.update(user).thenResolve(true);
		});
	},

	'get': function (session, req) {
		var p_id = req.params.id;
		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var promise;
		if (session.get('user_id') === p_id)
		{
			/* jshint newcap: false */
			promise = Q();
		}
		else
		{
			promise = this.checkPermission(session, 'admin');
		}

		var users = this.xo.users;
		return promise.then(function () {
			return users.first(p_id);
		}).then(function (user) {
			if (!user)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			return _.pick(user.properties, 'id', 'email', 'permission');
		});
	},

	'getAll': function (session) {
		var users = this.xo.users;
		return this.checkPermission(session, 'admin').then(function () {
			return users.get();
		}).then(function (all_users) {
			for (var i = 0, n = all_users.length; i < n; ++i)
			{
				all_users[i] = _.pick(
					all_users[i],
					'id', 'email', 'permission'
				);
			}

			return all_users;
		});
	},

	'set': function (session, request) {
		var p_id = request.params.id;
		var p_email = request.params.email;
		var p_password = request.params.password;
		var p_permission = request.params.permission;

		if ((undefined === p_id)
			|| ((undefined === p_email)
				&& (undefined === p_password)
				&& (undefined === p_permission)))
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			throw Api.err.UNAUTHORIZED;
		}

		var users = this.xo.users;
		return users.first(user_id).then(function (user) {
			// Get the current user to check its permission.
			if (!user.hasPermission('admin'))
			{
				throw Api.err.UNAUTHORIZED;
			}


			// @todo Check there are no invalid parameter.
			return users.first(p_id).fail(function () {
				throw Api.err.INVALID_PARAMS;
			});
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
				return user.setPassword(p_password).thenResolve(user);
			}

			return user;
		}).then(function (user) {
			// Save the updated user.

			return users.update(user);
		}).thenResolve(true);
	},
};

// Token management.
Api.fn.token = {
	'create': function (session) {
		var user_id = session.get('user_id');
		if ((undefined === user_id)
			|| session.has('token_id'))
		{
			throw Api.err.UNAUTHORIZED;
		}

		// @todo Token permission.

		return this.xo.tokens.generate(user_id).then(function (token) {
			return token.get('id');
		});
	},

	'delete': function (session, req) {
		var p_token = req.params.token;

		var tokens = this.xo.tokens;
		return tokens.first(p_token).then(function (token) {
			if (!token)
			{
				throw Api.err.INVALID_PARAMS;
			}

			// @todo Returns NO_SUCH_OBJECT if the token does not exists.
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

		var servers = this.xo.servers;
		return this.checkPermission(session, 'admin').then(function () {
			// @todo We are storing passwords which is bad!
			// Can we use tokens instead?
			return servers.add({
				'host': p_host,
				'username': p_username,
				'password': p_password,
			});
		}).then(function (server) {
			return (''+ server.id);
		});
	},

	'remove': function (session, req) {
		var p_id = req.params.id;

		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var servers = this.xo.servers;
		return this.checkPermission(session, 'admin').then(function () {
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
		var servers = this.xo.servers;
		return this.checkPermission(session, 'admin').then(function () {
			return servers.get();
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

// Extra methods not really bound to an object.
Api.fn.xo = {
	'getStats': function () {
		// @todo Keep up-to-date stats in this.xo to avoid unecessary
		// (and possibly heavy) computing.

		var xo = this.xo;
		return Q.all([
			xo.hosts.count(),
			xo.vms.get({
				'is_a_template': false,
				'is_control_domain': false,
			}),
			xo.srs.count(),
		]).spread(function (n_hosts, vms, n_srs) {
			var running_vms = _.where(vms, {
				'power_state': 'Running',
			});

			var n_vifs = 0;
			var n_vcpus = 0;
			var memory = 0;
			_.each(vms, function (vm) {
				n_vifs += vm.VIFs.length;
				n_vcpus += +vm.metrics.VCPUs_number;
				memory += +vm.metrics.memory_actual;
			});

			return {
				'hosts': n_hosts,
				'vms': vms.length,
				'running_vms': running_vms.length,
				'memory': memory,
				'vcpus': n_vcpus,
				'vifs': n_vifs,
				'srs': n_srs,
			};
		});
	},

	'getSessionId': function (req) {
		var p_pool_id = req.params.id;
		if (undefined === p_pool_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		return this.xo.pools.first(p_pool_id).then(function (pool) {
			return pool.get('sessionId');
		});
	},
};

Api.fn.xapi = {
	'__catchAll': function (session, req) {
		var RE = /^xapi\.(pool|host|vm|network|sr|vdi|pif|vif)\.getAll$/;
		var match;
		if (!(match = req.method.match(RE)))
		{
			throw Api.err.INVALID_METHOD;
		}

		return this.xo[match[1] +'s'].get();
	},

	'vm': {
		'pause': function (session, req) {
			var p_id = req.params.id;
			if (!p_id)
			{
				throw Api.err.INVALID_PARAMS;
			}

			var xo = this.xo;
			var vm;
			return this.checkPermission(session, 'write').then(function () {
				return xo.vms.first(p_id);
			}).then(function (tmp) {
				vm = tmp;

				if (!vm)
				{
					throw Api.err.NO_SUCH_OBJECT;
				}

				return xo.pools.first(vm.get('pool_uuid'));
			}).then(function (pool) {
				var xapi = xo.connections[pool.get('uuid')];

				return xapi.call('VM.pause', vm.get('ref'));
			}).thenResolve(true);
		},
	},
};
