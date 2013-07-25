var _ = require('underscore');
var crypto = require('crypto');
var hashy = require('hashy');
var Q = require('q');

var Collection = require('./collection');
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
// Models
//////////////////////////////////////////////////////////////////////

var Server = Model.extend({
	'validate': function () {
	},
});

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

var Pool = Model.extend({});

var Host = Model.extend({});

var VM = Model.extend({});

var Network = Model.extend({});

var SR = Model.extend({});

var VDI = Model.extend({});

//////////////////////////////////////////////////////////////////////
// Collections
//////////////////////////////////////////////////////////////////////

var Servers = Collection.extend({
	'model': Server,
});

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

var Pools = Collection.extend({
	'model': Pool,
});

var Hosts = Collection.extend({
	'model': Host,
});

var VMs = Collection.extend({
	'model': VM,
});

var Networks = Collection.extend({
	'model': Network,
});

var SRs = Collection.extend({
	'model': SR,
});

var VDIs = Collection.extend({
	'model': VDI,
});

//////////////////////////////////////////////////////////////////////

function Xo()
{
	if ( !(this instanceof Xo) )
	{
		return new Xo();
	}

	//--------------------------------------
	// Main objects (@todo should be persistent).

	this.servers = new Servers();
	this.tokens = new Tokens();
	this.users = new Users();

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

	// Connections to Xen pools/servers.
	this.connections = {};

	//--------------------------------------
	// Xen objects.

	this.pools = new Pools();
	this.hosts = new Hosts();
	this.vms = new VMs();

	this.networks = new Networks();
	this.srs = new SRs();
	this.vdis = new VDIs();

	// Connecting classes: VIF & PIF, VBD & SR.

	// -------------------------------------
	// Temporary data for testing purposes.

	this.servers.add({
		'host': '192.168.1.116',
		'username': 'root',
		'password': 'qwerty',
	}).done();
	this.users.add([{
		'email': 'bob@gmail.com',
		'pw_hash': '$2a$10$PsSOXflmnNMEOd0I5ohJQ.cLty0R29koYydD0FBKO9Rb7.jvCelZq',
		'permission': 'admin',
	}, {
		'email': 'toto@gmail.com',
		'pw_hash': '$2a$10$PsSOXflmnNMEOd0I5ohJQ.cLty0R29koYydD0FBKO9Rb7.jvCelZq',
		'permission': 'none',
	}]).done();
}
require('util').inherits(Xo, require('events').EventEmitter);

Xo.prototype.start = function () {

	var xo = this;

	// @todo Connect to persistent collection.

	// @todo Connect to Xen servers & fetch data.
	xo.servers.get().then(function (servers) {
		/* jshint maxparams:99 */

		_.each(servers, function (server) {
			var xapi = new Xapi(server.host);
			xo.connections[server.id] = xapi;

			xapi.connect(server.username, server.password).then(function () {
				var get_records = function (classes) {
					var promises = [];
					for (var i = 0, n = classes.length; i < n; i++)
					{
						promises.push(
							xapi.call(classes[i] +'.get_all_records')
						);
					}
					return Q.all(promises);
				};

				return get_records([
					// Main classes.
					'pool',
					'host',
					'VM',

					'network',
					'SR',
					'VDI',

					// Associated classes (e.g. metrics).
					'host_cpu',
					'host_metrics',
					'VM_metrics',
					'VM_guest_metrics',
				]);
			}).spread(function (
				pools,
				hosts,
				vms,

				networks,
				srs,
				vdis,

				host_cpus,
				host_metrics,
				vm_metrics,
				vm_guest_metrics
			) {
				var normalize = function (items) {
					return _.map(items, function (item, id) {
						item.id = id;
						return item;
					});
				};

				// Resolves some dependencies.
				_.each(hosts, function (host) {
					host.metrics = host_metrics[host.metrics];

					var cpus = [];
					_.each(host.host_CPUs, function (ref) {
						cpus.push(host_cpus[ref]);
					});
					host.host_CPUs = cpus;
				});
				_.each(vms, function (vm) {
					vm.metrics = vm_metrics[vm.metrics];
					vm.guest_metrics = vm_guest_metrics[vm.guest_metrics] || null;

					// @todo Associated objects must be included and
					// linked objects must be relinked by uuid.
				});

				return Q.all([
					xo.pools.add(normalize(pools)),
					xo.hosts.add(normalize(hosts)),
					xo.vms.add(normalize(vms)),

					xo.vms.add(normalize(networks)),
					xo.vms.add(normalize(srs)),
					xo.vms.add(normalize(vdis)),
				]);
			}).done();
		});
	}).done();

	//--------------------------------------

	xo.emit('started');
};

//////////////////////////////////////////////////////////////////////

module.exports = Xo;
