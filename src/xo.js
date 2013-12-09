var _ = require('underscore');
var crypto = require('crypto');
var hashy = require('hashy');
var Q = require('q');

var createMappedCollection = require('./MappedCollection');
var MemoryCollection = require('./collection/memory');
var RedisCollection = require('./collection/redis');
var Model = require('./model');
var Xapi = require('./xapi');

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
// Models & Collections.
//////////////////////////////////////////////////////////////////////

var Server = Model.extend({
	'validate': function () {
		// @todo
	},
});

var Servers = RedisCollection.extend({
	'model': Server,
});

//--------------------------------------------------------------------

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

var Tokens = RedisCollection.extend({
	'model': Token,

	'generate': function (user_id) {
		var self = this;
		return Token.generate(user_id).then(function (token) {
			return self.add(token);
		});
	}
});

//--------------------------------------------------------------------

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
				return user.setPassword(password).thenResolve(true);
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

// @todo handle email uniqueness.
var Users = RedisCollection.extend({
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

//--------------------------------------------------------------------

function Xo()
{
	if ( !(this instanceof Xo) )
	{
		return new Xo();
	}

	// Connections to Xen pools/servers.
	this.connections = {};
}
require('util').inherits(Xo, require('events').EventEmitter);

Xo.prototype.start = function (data) {
	var cfg = data.config;

	var xo = this;
	var redis = require('then-redis').createClient(cfg.get('redis', 'uri'));

	//--------------------------------------
	// Persistent collections.

	xo.servers = new Servers({
		'connection': redis,
		'prefix': 'xo:server',
		'indexes': ['host'],
	});
	xo.tokens = new Tokens({
		'connection': redis,
		'prefix': 'xo:token',
		'indexes': ['user_id'],
	});
	xo.users = new Users({
		'connection': redis,
		'prefix': 'xo:user',
		'indexes': ['email'],
	});

	xo.connections = {};

	xo.xclasses = [
		'console',
		'crashdump',
		'DR_task',
		'host',
		'host_cpu',
		'host_crashdump',
		'host_metrics',
		'host_patch',
		'message',
		'network',
		'PBD',
		'PCI',
		'PGPU',
		'PIF',
		'PIF_metrics',
		'pool',
		'SR',
		'VBD',
		'VDI',
		'VGPU',
		'VIF',
		'VIF_metrics',
		'VM',
		'VM_appliance',
		'VM_guest_metrics',
		'VM_metrics',
		// 'VMPP',
		// 'VTPM',
	];
	xo.xobjs = createMappedCollection(require('./spec'));

	var connect = function (server) {
		var pool_id = server.id;
		var xapi = new Xapi(server.host, server.username, server.password);
		xo.connections[pool_id] = xapi;

		var xclasses = xo.xclasses;
		var xobjs = xo.xobjs;

		// First retrieves all objects.
		return Q.all(_.map(xclasses, function (xclass) {
			return xapi.call(xclass +'.get_all_records')
				.then(function (records) {
					_.each(records, function (record) {
						record.$type = xclass;
						record.$pool = pool_id;
					});

					return xobjs.set(records);
				});
		})).then(function () {

			// Then listens for events.
			return function loop() {
				return xapi.call('event.next').then(function (events) {
					_.each(events, function (event) {
						var operation = event.operation;
						var record = event.snapshot;
						var ref = event.ref;
						var type = event.class;

						console.log(xapi.host, operation, type, ref);

						// Normalizes the model.
						record.$type = type;
						record.$pool = pool_id;

						if ('del' === event.operation)
						{
							xobjs.remove({ref: record});
						}
						else
						{
							xobjs.set({ref: record}, {remove: false});
						}
					});

					return loop();
				}, function (error) {
					if ('SESSION_NOT_REGISTERED' === error[0])
					{
						console.log('registering for events on '+ xapi.host);

						// We are registering for events here to
						// properly handle reconnections.
						return xapi.call('event.register', ['*']).then(loop);
					}

					throw error;
				});
			}();
		}, function (error) {
			console.error(xapi.host, error);
		});
	};
	// Connect existing servers.
	xo.servers.get().then(function (servers) {
		_.each(servers, connect);
	}).done();
	// Automatically connect new servers.
	xo.servers.on('add', function (servers) {
		_.each(servers, connect);
	});
	xo.servers.on('remove', function (server_ids) {
		_.each(server_ids, function (server_id) {
			delete xo.connections[server_id];
		});
	});

	// xo events are used to automatically close connections if the
	// associated credentials are invalidated.
	xo.tokens.on('remove', function (token_ids) {
		_.each(token_ids, function (token_id) {
			xo.emit('token.revoked:'+ token_id);
		});
	});
	xo.users.on('remove', function (user_ids) {
		_.each(user_ids, function (user_id) {
			xo.emit('user.revoked:'+ user_id);

			// All associated tokens must be destroyed too.
			xo.tokens.get({'user_id': user_id}).then(function (tokens) {
				return xo.tokens.remove(_.pluck(tokens, 'id'));
			}).done();
		});
	});

	//--------------------------------------

	xo.emit('started', data);
};

//////////////////////////////////////////////////////////////////////

module.exports = Xo;
