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
	var method = this.getMethod(request.method);

	if (!method)
	{
		console.warn('Invalid method: '+ request.method);
		throw Api.err.INVALID_METHOD;
	}

	return method.call(this, session, request);
};

Api.prototype.getMethod = function (name) {
	var parts = name.split('.');

	var current = Api.fn;
	for (
		var i = 0, n = parts.length;
		(i < n) && (current = current[parts[i]]);
		++i
	)
	{
		/* jshint noempty:false */
	}

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

Api.prototype.getUserPublicProperties = function (user) {
	// Handles both properties and wrapped models.
	var properties = user.properties || user;

	return _.pick(properties, 'id', 'email', 'permission');
};

Api.prototype.getServerPublicProperties = function (server) {
	// Handles both properties and wrapped models.
	var properties = server.properties || server;

	return _.pick(properties, 'id', 'host', 'username');
};

Api.prototype.throw = function (errorId) {
	throw Api.err[errorId];
};

//////////////////////////////////////////////////////////////////////

Api.fn  = {};

var $register = function (path, fn) {
	var component, current;

	if (!_.isArray(path))
	{
		path = path.split('.');
	}

	current = Api.fn;
	for (var i = 0, n = path.length - 1; i < n; ++i)
	{
		component = path[i];
		current = (current[component] || (current[component] = {}));
	}

	if (_.isFunction(fn))
	{
		current[path[n]] = fn;
	}
	else
	{
		// If it is not an function but an object, copies its
		// properties.

		component = path[n];
		current = (current[component] || (current[component] = {}));

		for (var prop in fn)
		{
			current[prop] = fn[prop];
		}
	}
};

// User management.
$register('user', require('./api/user'));

// Server management.
$register('server', require('./api/server'));

//--------------------------------------------------------------------

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
		if (!(user && user.checkPassword(p_pass)))
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		session.set('user_id', user.get('id'));
		return this.getUserPublicProperties(user);
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

		var user_id = token.get('user_id');

		session.set('token_id', token.get('id'));
		session.set('user_id', user_id);

		var user = $waitPromise(this.xo.users.first(user_id));

		return this.getUserPublicProperties(user);
	},

	'getUser': $deprecated(function (session) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			return null;
		}

		var user = $waitPromise(this.xo.users.first(user_id));

		return this.getUserPublicProperties(user);
	}),

	'getUserId': function (session) {
		return session.get('user_id', null);
	},

	'createToken': 'token.create',

	'destroyToken': 'token.delete',
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

// Extra methods not really bound to an object.
Api.fn.xo = {
	'getAllObjects': function () {
		return this.xo.xobjs.getAll();
	}
};

// `xapi.vm` methods.
_.each({
	pause: [],

	// TODO: If XS tools are unavailable, do a hard reboot.
	reboot: 'clean_reboot',

	// TODO: If XS tools are unavailable, do a hard shutdown.
	shutdown: 'clean_shutdown',

	start: [
		false, // Start paused?
		false, // Skip the pre-boot checks?
	],

	unpause: [],
}, function (def, name) {
	var method = name;
	var params = [];
	if (_.isString(def))
	{
		method = def;
	}
	else if (_.isArray(params))
	{
		params = def;
	}
	else
	{
		// TODO: Handle more complex definition.
		/* jshint noempty:false */
	}

	$register('xapi.vm.'+ name, function (session, req) {
		// This method expect to the VM's UUID.
		var p_id = req.params.id;
		if (!p_id)
		{
			throw Api.err.INVALID_PARAMS;
		}

		// The current session MUST have the `write`
		// permission.
		this.checkPermission(session, 'write');

		// Retrieves the VM with this UUID.
		var vm = this.xo.xobjs.get(p_id);
		if (!vm)
		{
			throw Api.err.NO_SUCH_OBJECT;
		}

		// Gets the corresponding connection.
		var xapi = this.xo.xapis[vm.$pool];

		xapi.call.apply(xapi, ['VM.'+ method, vm.$ref].concat(params));

		return true;
	});
});

Api.fn.system = {

	// Returns the list of available methods similar to XML-RPC
	// introspection
	// (http://xmlrpc-c.sourceforge.net/introspection.html).
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
