var _ = require('underscore');

//--------------------------------------------------------------------

var $waitPromise = require('./fibers-utils').$waitPromise;

//////////////////////////////////////////////////////////////////////

function $deprecated(fn)
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
		throw Api.err.INVALID_METHOD;
	}

	return $waitPromise(method.call(this, session, request));
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
		return $deprecated(this.getMethod(current));
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

// TODO: Helper functions that could be written:
// - checkParams(req.params, param1, ..., paramN)

// TODO: Put helpers in their own namespace.
Api.prototype.checkPermission = function (session, permission)
{
	// TODO: Handle token permission.

	var user_id = session.get('user_id');

	if (undefined === user_id)
	{
		throw Api.err.UNAUTHORIZED;
	}

	if (!permission)
	{
		return;
	}

	var user = $waitPromise(this.xo.users.first(user_id));
	// The user MUST exist at this time.

	if (!user.hasPermission(permission))
	{
		throw Api.err.UNAUTHORIZED;
	}
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

		var user = $waitPromise(this.xo.users.first({'email': p_email}));
		if (!user)
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		if (!user.checkPassword(p_pass))
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		session.set('user_id', user.get('id'));
		return true;
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

		var token = $waitPromise(this.xo.tokens.first(p_token));
		if (!token)
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		session.set('token_id', token.get('id'));
		session.set('user_id', token.get('user_id'));

		return true;
	},

	'getUser': $deprecated(function (session) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			return null;
		}

		var user = $waitPromise(this.xo.users.first(user_id))

		return _.pick(user.properties, 'id', 'email', 'permission');
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

		$waitPromise(this.checkPermission(session, 'admin'));

		var user = $waitPromise(this.xo.users.create(p_email, p_pass, p_perm));

		return (''+ user.id);
	},

	'delete': function (session, req) {
		var p_id = req.params.id;
		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		$waitPromise(this.checkPermission(session, 'admin'));

		if (!this.xo.users.remove(p_id))
		{
			throw Api.err.NO_SUCH_OBJECT;
		}

		return true;
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

		var user = this.xo.users.first(user_id);
		if (!user.checkPassword(p_old))
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		user.setPassword(p_new);
		$waitPromise(this.xo.users.update(user));

		return true;
	},

	'get': function (session, req) {
		var p_id = req.params.id;
		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		// Only an administrator can see another user.
		if (session.get('user_id') !== p_id)
		{
			$waitPromise(this.checkPermission(session, 'admin'));
		}

		var user = this.xo.users.first(p_id);
		if (!user)
		{
			throw Api.err.NO_SUCH_OBJECT;
		}

		return _.pick(user.properties, 'id', 'email', 'permission');
	},

	'getAll': function (session) {
		$waitPromise(this.checkPermission(session, 'admin'));

		var users = this.xo.users.get();
		for (var i = 0, n = users.length; i < n; ++i)
		{
			users[i] = _.pick(
				users[i],
				'id', 'email', 'permission'
			);
		}
		return users;
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

		$waitPromise(this.checkPermission(session, 'admin'));

		// TODO: Check there are no invalid parameter.
		var user = $waitPromise(this.xo.users.first(p_id));
		// TODO: Check user exists.

		// Gets the user to update.

		// TODO: Check undefined value are ignored.
		user.set({
			'email': p_email,
			'permission': p_permission,
		});

		if (p_password)
		{
			user.setPassword(p_password);
		}

		$waitPromise(this.xo.users.update(user));

		return true;
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

		// TODO: Token permission.

		var token = $waitPromise(this.xo.tokens.generate(user_id));
		return token.id;
	},

	'delete': function (session, req) {
		var p_token = req.params.token;

		var token = $waitPromise(this.xo.tokens.first(p_token));
		if (!token)
		{
			throw Api.err.INVALID_PARAMS;
		}

		// TODO: Returns NO_SUCH_OBJECT if the token does not exists.
		$waitPromise(this.xo.tokens.remove(p_token));

		return true;
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

		$waitPromise(this.checkPermission(session, 'admin'));

		// TODO: We are storing passwords which is bad!
		// Could we use tokens instead?
		var server = $waitPromise(this.xo.servers.add({
			'host': p_host,
			'username': p_username,
			'password': p_password,
		}));

		return (''+ server.id);
	},

	'remove': function (session, req) {
		var p_id = req.params.id;

		if (undefined === p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		$waitPromise(this.checkPermission(session, 'admin'));

		if (!$waitPromise(this.xo.servers.remove(p_id)))
		{
			throw Api.err.NO_SUCH_OBJECT;
		}

		return true;
	},

	'getAll': function (session) {
		$waitPromise(this.checkPermission(session, 'admin'));

		var servers = this.xo.servers.get();
		_.each(servers, function (server, i) {
			servers[i] = _.pick(server, 'id', 'host', 'username');
		});

		return servers;
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
	'getAllObjects': function () {
		return this.xo.xobjs.getAll();
	}
};

Api.fn.xapi = {

	// TODO: All this function should be generated.
	'vm': {
		'pause': function (session, req) {
			var p_id = req.params.id;
			if (!p_id)
			{
				throw Api.err.INVALID_PARAMS;
			}

			$waitPromise(this.checkPermission(session, 'write'));

			var vm = this.xo.xobjs.get(p_id);
			if (!vm)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			var xapi = this.xo.connections[vm.get('pool')];
			xapi.call('VM.pause', p_id);

			return true;
		},

		'unpause': function (session, req) {
			var p_id = req.params.id;
			if (!p_id)
			{
				throw Api.err.INVALID_PARAMS;
			}

			$waitPromise(this.checkPermission(session, 'write'));

			var vm = this.xo.xobjs.get(p_id);
			if (!vm)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			var xapi = this.xo.connections[vm.get('pool')];
			xapi.call('VM.unpause', p_id);

			return true;
		},

		'reboot': function (session, req) {
			var p_id = req.params.id;
			if (!p_id)
			{
				throw Api.err.INVALID_PARAMS;
			}

			$waitPromise(this.checkPermission(session, 'write'));

			var vm = this.xo.xobjs.get(p_id);
			if (!vm)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			var xapi = this.xo.connections[vm.get('pool')];

			// TODO: If XS tools are unavailable, do a hard reboot.
			xapi.call('VM.clean_reboot', p_id);

			return true;
		},

		'shutdown': function (session, req) {
			var p_id = req.params.id;
			if (!p_id)
			{
				throw Api.err.INVALID_PARAMS;
			}

			$waitPromise(this.checkPermission(session, 'write'));

			var vm = this.xo.xobjs.get(p_id);
			if (!vm)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			var xapi = this.xo.connections[vm.get('pool')];

			// TODO: If XS tools are unavailable, do a hard shutdown.
			xapi.call('VM.clean_shutdown', p_id);

			return true;
		},

		// we choose to start with default additional parameters:
		// false (don't start paused) and false (don't skip pre-boot checks)
		'start': function (session, req) {
			var p_id = req.params.id;
			if (!p_id)
			{
				throw Api.err.INVALID_PARAMS;
			}

			$waitPromise(this.checkPermission(session, 'write'));

			var vm = this.xo.xobjs.get(p_id);
			if (!vm)
			{
				throw Api.err.NO_SUCH_OBJECT;
			}

			var xapi = this.xo.connections[vm.get('pool')];
			xapi.call('VM.start', p_id);

			return true;
		},
	},
};

Api.fn.system = {

	// Returns the list of available methods similar to XML-RPC
	// introspection (http://xmlrpc-c.sourceforge.net/introspection.html).
	'listMethods': function () {
		var methods = [];

		(function browse(container, path) {
			var n = path.length;
			_.each(container, function (content, key) {
				path[n] = key;
				if (_.isFunction(content))
				{
					methods.push(path.join('.'));
				}
				else
				{
					browse(content, path);
				}
			});
			path.pop();
		})(Api.fn, []);

		return methods;
	},
};
