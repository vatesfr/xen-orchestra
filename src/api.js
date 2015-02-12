'use strict';

//====================================================================

var assign = require('lodash.assign');
var Bluebird = require('bluebird');
var debug = require('debug')('xo:api');
var forEach = require('lodash.foreach');
var isArray = require('lodash.isarray');
var isFunction = require('lodash.isfunction');
var isObject = require('lodash.isobject');
var isString = require('lodash.isstring');
var keys = require('lodash.keys');
var pick = require('lodash.pick');
var requireTree = require('require-tree');
var schemaInspector = require('schema-inspector');

var apiErrors = require('./api-errors');
var coroutine = require('./fibers-utils').$coroutine;
var InvalidParameters = require('./api-errors').InvalidParameters;
var MethodNotFound = require('./api-errors').MethodNotFound;
var Unauthorized = require('./api-errors').Unauthorized;
var wait = require('./fibers-utils').$wait;
var wrap = require('./utils').wrap;

//====================================================================

function $deprecated(fn)
{
	return function (session, req) {
		console.warn(req.method +' is deprecated!');

		return fn.apply(this, arguments);
	};
}

//====================================================================

// TODO: Helper functions that could be written:
// - checkParams(req.params, param1, ..., paramN)

var helpers = {};

helpers.checkPermission = function (permission)
{
	// TODO: Handle token permission.

	var userId = this.session.get('user_id', undefined);

	if (undefined === userId)
	{
		throw new Unauthorized();
	}

	if (!permission)
	{
		return;
	}

	var user = wait(this.users.first(userId));
	// The user MUST exist at this time.

	if (!user.hasPermission(permission))
	{
		throw new Unauthorized();
	}
};

// Checks and returns parameters.
helpers.getParams = function (schema) {
	var params = this.request.params;

	schema = {
		type: 'object',
		properties: schema,
	};

	var result = schemaInspector.validate(schema, params);

	if (!result.valid)
	{
		throw new InvalidParameters(result.error);
	}

	return params;
};

helpers.getUserPublicProperties = function (user) {
	// Handles both properties and wrapped models.
	var properties = user.properties || user;

	return pick(properties, 'id', 'email', 'permission');
};

helpers.getServerPublicProperties = function (server) {
	// Handles both properties and wrapped models.
	var properties = server.properties || server;

	return pick(properties, 'id', 'host', 'username');
};

// Deprecated!
var errorClasses = {
	ALREADY_AUTHENTICATED: apiErrors.AlreadyAuthenticated,
	INVALID_CREDENTIAL: apiErrors.InvalidCredential,
	INVALID_PARAMS: apiErrors.InvalidParameters,
	NO_SUCH_OBJECT: apiErrors.NoSuchObject,
	NOT_IMPLEMENTED: apiErrors.NotImplementd,
};
helpers.throw = function (errorId, data) {
	throw new (errorClasses[errorId])(data);
};

//====================================================================

function Api(xo)
{
	if ( !(this instanceof Api) )
	{
		return new Api(xo);
	}

	this.xo = xo;
}

var execHelper = coroutine(function (session, request) {
	var ctx = Object.create(this.xo);
	assign(ctx, helpers, {
		session: session,
		request: request,
	});

	var method = this.getMethod(request.method);

	if (!method)
	{
		console.warn('Invalid method: '+ request.method);
		throw new MethodNotFound(request.method);
	}

	if ('permission' in method)
	{
		helpers.checkPermission.call(ctx, method.permission);
	}

	if (method.params)
	{
		helpers.getParams.call(ctx, method.params);
	}

	return method.call(ctx, request.params);
});

Api.prototype.exec = function (session, request) {
	var method = request.method;

	debug('%s(...)', method);

	return Bluebird.try(execHelper, [session, request], this).then(
		function (result) {
			debug('%s(...) → %s', method, typeof result);
			return result;
		},
		function (error) {
			debug('Error: %s(...) → %s', method, error);
			throw error;
		}
	);
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
	if (isFunction(current))
	{
		return current;
	}

	// It's a (deprecated) alias.
	if (isString(current))
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

//====================================================================

var $register = function (path, fn, params) {
	var component, current;

	if (params)
	{
		fn.params = params;
	}

	if (!isArray(path))
	{
		path = path.split('.');
	}

	current = Api.fn;
	for (var i = 0, n = path.length - 1; i < n; ++i)
	{
		component = path[i];
		current = (current[component] || (current[component] = {}));
	}

	if (isFunction(fn))
	{
		current[path[n]] = fn;
	}
	else if (isObject(fn) && !isArray(fn))
	{
		// If it is not an function but an object, copies its
		// properties.

		component = path[n];
		current = (current[component] || (current[component] = {}));

		assign(current, fn);
	}
	else
	{
		current[path[n]] = wrap(fn);
	}
};

Api.fn = requireTree('./api');

//--------------------------------------------------------------------

$register('system.getVersion', wrap('0.1'));

$register('xo.getAllObjects', function () {
	return this.getObjects();
});

// Returns the list of available methods similar to XML-RPC
// introspection (http://xmlrpc-c.sourceforge.net/introspection.html).
(function () {
	var methods = {};

	(function browse(container, path) {
		var n = path.length;
		forEach(container, function (content, key) {
			path[n] = key;
			if (isFunction(content))
			{
				methods[path.join('.')] = {
					description: content.description,
					params: content.params || {},
					permission: content.permission,
				};
			}
			else
			{
				browse(content, path);
			}
		});
		path.pop();
	})(Api.fn, []);

	$register('system.listMethods', wrap(keys(methods)));
	$register('system.methodSignature', function (params) {
		var method = methods[params.name];

		if (!method)
		{
			this.throw('NO_SUCH_OBJECT');
		}

		// XML-RPC can have multiple signatures per method.
		return [
			// XML-RPC requires the method name.
			assign({name: params.name}, method)
		];
	}, {
		name: {
			description: 'method to describe',
			type: 'string',
		},
	});

	$register('system.getMethodsInfo', wrap(methods));
})();
