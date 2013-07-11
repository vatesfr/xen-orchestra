var _ = require('underscore');
var crypto = require('crypto');
var hashy = require('hashy');
var Q = require('q');

var Collection = require('./collection');
var Model = require('./model');

//////////////////////////////////////////////////////////////////////

var check = function () {
	var errors;

	var validator = new (require('validator').Validator)();
	validator.error = function (err) {
		(errors || (errors = [])).push(err);
		return this;
	};

	var check = function (data) {
		validator.check(data);
	};
	check.pop = function () {
		var res = errors;
		errors = undefined;
		return res;
	};

	return check;
}();

//////////////////////////////////////////////////////////////////////
// Models
//////////////////////////////////////////////////////////////////////

// @todo We could also give a permission level to tokens (<=
// user.permission).
var Token = Model.extend({
	// Validates model attributes.
	// 'validate': function (attr) {
	// 	check(attr.id).len(10);
	// 	check(attr.user_id).isInt();

	// 	return check.pop();
	// },
}, {
	'generate': function (user_id) {
		return Q.ninvoke(crypto, 'randomBytes', 32).then(function (buf) {
			return new Token({
				'id': buf.toString('base64'),
				'user_id': user_id,
			});
		});
	},
});

var User = Model.extend({
	'default': {
		'permission': 'none',
	},

	// Validates model attributes.
	// 'validate': function (attr) {
	// 	check(attr.id).isInt();
	// 	check(attr.email).isEmail();
	// 	check(attr.pw_hash).len(40);
	// 	check(attr.permission).isIn('none', 'read', 'write', 'admin');

	// 	return check.pop();
	// },

	'setPassword': function (password) {
		var self = this;
		return hashy.hash(password).then(function (hash) {
			self.set('pw_hash', hash);
		});
	},

	// Checks and updates the hash if necessary.
	'checkPassword': function (password) {
		var hash = this.get('pw_hash');
		var user = this;

		return hashy.verify(password, hash).then(function (success) {
			if (!success)
			{
				return false;
			}

			if (hashy.needsRehash(hash))
			{
				return user.setPassword(password).then(true);
			}

			return true;
		});
	},

	'hasPermission': function (permission) {
		var perms = {
			'none': 0,
			'read': 1,
			'write': 2,
			'admin': 3,
		};

		return (perms[this.get('permission')] >= perms[permission]);
	},
});

var Server = Model.extend({
	'validate': function () {
	},
});

//////////////////////////////////////////////////////////////////////
// Collections
//////////////////////////////////////////////////////////////////////

var Tokens = Collection.extend({
	'model': Token,

	'generate': function (user_id) {
		var self = this;
		return Token.generate(user_id).then(function (token) {
			return self.add(token);
		});
	}
});

// @todo handle email uniqueness.
var Users = Collection.extend({
	'model': User,

	'create': function (email, password, permission) {
		var user = new User({
			'email': email,
		});
		if (permission)
		{
			user.set('permission', permission);
		}

		var self = this;
		return  user.setPassword(password).then(function () {
			return self.add(user);
		});
	}
});

var Servers = Collection.extend({
	'model': Server,
});

//////////////////////////////////////////////////////////////////////

function Xo()
{
	this.servers = new Servers();
	this.tokens = new Tokens();
	this.users = new Users();
	this.users.add({
		'email': 'bob@gmail.com',
		'pw_hash': '$2a$10$PsSOXflmnNMEOd0I5ohJQ.cLty0R29koYydD0FBKO9Rb7.jvCelZq',
		'permission': 'admin',
	}).done();

	// This events are used to automatically close connections if the
	// associated credentials are invalidated.
	var self = this;
	this.tokens.on('remove', function (token_ids) {
		_.each(token_ids, function (token_id) {
			self.emit('token.revoked:'+ token_id);
		});
	});
	this.users.on('remove', function (user_ids) {
		_.each(user_ids, function (user_id) {
			self.emit('user.revoked:'+ user_id);
		});
	});
}
require('util').inherits(Xo, require('events').EventEmitter);

module.exports = function () {
	return new Xo();
};
