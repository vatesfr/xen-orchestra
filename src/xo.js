var _ = require('underscore');
var Backbone = require('backbone');
var crypto = require('crypto');
var hashy = require('hashy');
var Q = require('q');

//////////////////////////////////////////////////////////////////////

var check = function () {
	var errors = undefined;

	var validator = new require('validator').Validator();
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
var Token = Backbone.Model.extend({
	// Validates model attributes.
	'validate': function (attr) {
		check(attr.id).len(10);
		check(attr.user_id).isInt();

		return check.pop();
	},
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

var User = Backbone.Model.extend({
	'default': {
		'permission': 'none',
	},

	'initialize': function ()
	{
		this.on('change:password', function (model, password) {
			this.unset('password', {'silent': true});

			var user = this;
			hashy.hash(password).then(function (hash) {
				user.set('pw_hash', hash);
			}).done();
		});
	},

	// Validates model attributes.
	'validate': function (attr) {
		check(attr.id).isInt();
		check(attr.email).isEmail();
		check(attr.pw_hash).len(40);
		check(attr.permission).isIn('none', 'read', 'write', 'admin');

		return check.pop();
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
				user.set('password', password);
			}
		});
	},
});

//////////////////////////////////////////////////////////////////////
// Collections
//////////////////////////////////////////////////////////////////////

var Tokens = Backbone.Collection.extend({
	'model': Token,
});

var Users = Backbone.Collection.extend({
	'model': User,
});

//////////////////////////////////////////////////////////////////////

function Xo()
{
	this.tokens = new Tokens();
	this.users = new Users();
}

module.exports = function () {
	return new Xo;
};
