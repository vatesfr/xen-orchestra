'use strict';

//////////////////////////////////////////////////////////////////////

var $_ = require('underscore');

var $requireTree = require('require-tree');

var $schemaInspector = require('schema-inspector');

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

// TODO: Helper functions that could be written:
// - checkParams(req.params, param1, ..., paramN)

var helpers = {};

helpers.checkPermission = function (permission)
{
	// TODO: Handle token permission.

	var userId = this.session.get('user_id', undefined);

	if (undefined === userId)
	{
		throw Api.err.UNAUTHORIZED;
	}

	if (!permission)
	{
		return;
	}

	var user = $wait(this.users.first(userId));
	// The user MUST exist at this time.

	if (!user.hasPermission(permission))
	{
		throw Api.err.UNAUTHORIZED;
	}
};

// Checks and returns parameters.
helpers.getParams = function (schema) {
	var params = this.request.params;

	schema = {
		type: 'object',
		properties: schema,
	};

	var result = $schemaInspector.validate(schema, params);

	if (!result.valid)
	{
		this.throw('INVALID_PARAMS', result.error);
	}

	return params;
};

helpers.getUserPublicProperties = function (user) {
	// Handles both properties and wrapped models.
	var properties = user.properties || user;

	return $_.pick(properties, 'id', 'email', 'permission');
};

helpers.getServerPublicProperties = function (server) {
	// Handles both properties and wrapped models.
	var properties = server.properties || server;

	return $_.pick(properties, 'id', 'host', 'username');
};

helpers.throw = function (errorId, data) {
	var error = Api.err[errorId];

	if (!error)
	{
		console.error('Invalid error:', errorId);
		throw Api.err.SERVER_ERROR;
	}

	if (data)
	{
		error = $_.extend({}, error, {data: data});
	}

	throw error;
};

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
	var ctx = Object.create(this.xo);
	$_.extend(ctx, helpers, {
		session: session,
		request: request,
	});

	var method = this.getMethod(request.method);

	if (!method)
	{
		console.warn('Invalid method: '+ request.method);
		throw Api.err.INVALID_METHOD;
	}

	if (method.params)
	{
		helpers.getParams.call(ctx, method.params);
	}

	return method.call(ctx, request.params);
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
	if ($_.isFunction(current))
	{
		return current;
	}

	// It's a (deprecated) alias.
	if ($_.isString(current))
	{
		return $deprecated(this.getMethod(current));
	}

	// No entry found, looking for a catch-all method.
	current = Api.fn;
	var catchAll;
	for (i = 0; (i < n) && (current = current[parts[i]]); ++i)
	{
		catchAll = current.__catchAll || catchAll;
	}

	return catchAll;
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

var $register = function (path, fn, params) {
	var component, current;

	if (params)
	{
		fn.params = params;
	}

	if (!$_.isArray(path))
	{
		path = path.split('.');
	}

	current = Api.fn;
	for (var i = 0, n = path.length - 1; i < n; ++i)
	{
		component = path[i];
		current = (current[component] || (current[component] = {}));
	}

	if ($_.isFunction(fn))
	{
		current[path[n]] = fn;
	}
	else if ($_.isObject(fn) && !$_.isArray(fn))
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
	return this.getObjects();
});

// Returns the list of available methods similar to XML-RPC
// introspection (http://xmlrpc-c.sourceforge.net/introspection.html).
(function () {
	var methods = {};

	(function browse(container, path) {
		var n = path.length;
		$_.each(container, function (content, key) {
			path[n] = key;
			if ($_.isFunction(content))
			{
				methods[path.join('.')] = content;
			}
			else
			{
				browse(content, path);
			}
		});
		path.pop();
	})(Api.fn, []);

	$register('system.listMethods', $_.keys(methods));

	$register('system.methodSignature', function (params) {
		var method = methods[params.name];

		if (!method)
		{
			throw Api.err.NO_SUCH_OBJECT;
		}

		return {
			name: params.name,
			description: method.description || null,
			params: method.params || null,
		};
	}, {
		name: {
			description: 'method to describe',
			type: 'string',
		},
	});
})();
