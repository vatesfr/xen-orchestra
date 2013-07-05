var _ = require('underscore');

//////////////////////////////////////////////////////////////////////

function deprecated(fn)
{
	return function (session, req, res) {
		console.warn(req.method +' is deprecated!');

		return fn.call(this, session, req, res);
	};
}

//////////////////////////////////////////////////////////////////////

function Api(xo)
{
	this.xo = xo;
}

Api.prototype.exec = function (session, req, res) {
	var method = this.get(req.method);

	if (!method)
	{
		res.sendError(Api.err.INVALID_METHOD);
		return;
	}

	try
	{
		var result = method.call(this.xo, session, req, res);
		if (undefined !== result)
		{
			res.sendResult(result);
		}
	}
	catch (e)
	{
		res.sendError(e);
	}
};

Api.prototype.get = function (name) {
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
		return deprecated(this.get(current));
	}

	return undefined;
	;
};

module.exports = function (xo) {
	return new Api(xo);
};

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

	'ALREADY_AUTHENTICATED': err(0, 'already authenticated'),

	// Invalid email & passwords or token.
	'INVALID_CREDENTIAL': err(1, 'invalid credential'),

	// Not authenticated or not enough permissions.
	'UNAUTHORIZED': err(2, 'not authenticated'),
)};

//////////////////////////////////////////////////////////////////////

Api.fn  = {};

Api.fn.api = {
	'getVersion' : function (session, req, res) {
		return '0.1';
	},
};

// Session management
Api.fn.session = {
	'signInWithPassword': function (session, req, res) {
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

		var user = this.users.findWhere({'email': p_email});
		if (!user)
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		user.checkPassword(p_pass).then(function (success) {
			if (!success)
			{
				res.sendError(Api.err.INVALID_CREDENTIAL);
				return;
			}

			res.sendResult(true);
		}).done();
	},

	'signInWithToken': function (session, req, res) {
		var p_token = req.params.token;

		if (!p_token)
		{
			throw Api.err.INVALID_PARAMS;
		}

		if (session.has('user_id'))
		{
			throw Api.err.ALREADY_AUTHENTICATED;
		}

		var token = this.tokens.get(p_token);
		if (!token)
		{
			throw Api.err.INVALID_CREDENTIAL;
		}

		// @todo How to disconnect when the token is deleted?
		//
		// @todo How to not leak the event callback when the
		// connection is closed?

		session.set('token_id', token.id);
		session.set('user_id', token.user_id);
		return true;
	},

	'getUser': deprecated(function (session, req, res) {
		var user_id = session.get('user_id');
		if (undefined === user_id)
		{
			return null;
		}

		return _.pick(users.get(user_id), 'id', 'email');
	});

	'getUserId': function (session, req, res) {
		return session.get('user_id', null);
	};

	'createToken': 'token.create'

	'destroyToken': 'token.delete',
};

// User management.
Api.fn.user = {
	'create': function (session, req, res) {
		var p_email = req.params.email;
		var p_pass = req.params.password;
		var p_perm = req.params.permission;

		if (!p_email || !p_pass || !p_perm)
		{
			throw Api.err.INVALID_PARAMS;
		}

		var user = new this.users.model({
			'email': p_email,
			'password': p_pass,
			'permission': p_perm,
		});

		// @todo How to save it and to retrieve its unique id?
	},

	'delete': function (session, req, res) {
		var p_id = req.params.id;

		var user
	},

	'changePassword': function (session, req, res) {

	},

	'getAll': function (session, req, res) {

	},

	'set': function (session, req, res) {

	},
};

// Token management.
Api.fn.token = {
	'create': function (session, req, res) {
		var user_id = session.get('user_id');
		if ((undefined === user_id)
			|| session.has('token_id'))
		{
			throw Api.err.UNAUTHORIZED;
		}

		// @todo Ugly.
		var token = this.tokens.model.generate(user_id);
		this.tokens.add(token);

		return token.id;
	},

	'delete': function (session, req, res) {
		var p_token = req.params.token;

		if (!this.tokens.get(p_token))
		{
			throw Api.err.INVALID_PARAMS;
		}

		this.tokens.remove(p_token);
		return true;
	},
};

// VM
Api.fn.vm = {

};
