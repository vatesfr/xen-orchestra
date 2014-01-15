var _ = require('underscore');

var $requireTree = require('require-tree');

//--------------------------------------------------------------------

var $wait = require('./fibers-utils').$wait;

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

	var user = $wait(this.xo.users.first(user_id));
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
	else if (_.isObject(fn))
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
	else
	{
		// Wrap this value in a function.
		current[path[n]] = function () {
			return fn;
		};
	}
};

Api.fn = $requireTree('./api');

//--------------------------------------------------------------------

$register('api.getVersion', '0.1');

$register('xo.getAllObjects', function () {
	return this.xo.xobjs.getAll();
});

// Returns the list of available methods similar to XML-RPC
// introspection (http://xmlrpc-c.sourceforge.net/introspection.html).
(function () {
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

	$register('system.listMethods', methods);
})();
