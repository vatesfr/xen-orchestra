/**
 * This file is a part of Xen Orchestra Web.
 *
 * Xen Orchestra Web is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * Xen Orchestra Web is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xen Orchestra Web. If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * @author Olivier Lambert <olivier.lambert@vates.fr>
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

(function (Q, _, $, Backbone, undefined) {
	'use strict';

	// @todo Possibly remove.
	Backbone.Collection.prototype.subset = function (sieve) {
		if (!sieve)
		{
			sieve = function () {
				return true;
			};
		}

		var self = this;

		var subset = new self.constructor(self.filter(sieve));
		self.on('add', function (model) {
			if (sieve(model))
			{
				subset.add(model);
			}
		});
		self.on('remove', function (model) {
			subset.remove(model);
		});
		self.on('change', function (model) {
			if (sieve(model))
			{
				subset.set(model, {
					'remove': false,
				});
			}
			else
			{
				subset.remove(model);
			}
		});

		return subset;
	};

	//////////////////////////////////////////////////////////////////
	// Connection to XO.
	//////////////////////////////////////////////////////////////////

	var XO = function (url) {
		var xo = this;

		// Identifier of the next request.
		var next_id = 0;

		// Promises linked to the requests.
		var deferreds = {};

		// When the socket is closed, request are enqueued.
		var queue = [];

		// Websocket used to connect to XO-Server.
		var socket = new WebSocket(url);

		// Function used to send requests when the socket is opened.
		var send = function (method, params, deferred) {
			var id = next_id++;

			socket.send(JSON.stringify({
				'jsonrpc': '2.0',
				'id': id,
				'method': method,
				'params': params || [],
			}));

			deferreds[id] = deferred || Q.defer();
			return deferreds[id].promise;
		};

		// Function used to enqueue requests when the socket is closed.
		var enqueue = function  (method, params) {
			var deferred = Q.defer();

			queue.push([method, params, deferred]);

			return deferred.promise;
		};

		// When the websocket opens, send any requests enqueued.
		socket.addEventListener('open', function () {
			// New requests are sent directly.
			xo.call = send;

			var query;
			while ( (query = queue.shift()) )
			{
				send(query[0], query[1], query[2]);
			}
		});

		// When the websocket closes, requests are not sent directly
		// but enqueud.
		socket.addEventListener('close', function () {
			xo.call = enqueue;
		});

		// When a message is received, we call the corresponding
		// deferred (if any).
		socket.addEventListener('message', function (event) {
			var response = JSON.parse(event.data);

			var id = response.id;
			var deferred = deferreds[id];
			delete deferreds[id];

			var error = response.error;
			if (undefined !== error)
			{
				deferred.reject(error);
				return;
			}

			var result = response.result;
			if (undefined === result)
			{
				/* jshint devel:true */
				deferred.reject({
					'message': 'a message with no error nor result has been' +
						' received',
					'object': response,
				});
				return;
			}

			deferred.resolve(result);
		});

		// @todo What to do if there is an error in the websocket.
		socket.addEventListener('error', function (error) {
			console.error(error);
		});

		// The default way to send a request is by enqueuing it.
		xo.call = enqueue;

		// @todo
		xo.clone = function () {
			return new XO(url);
		};
	};

	//////////////////////////////////////////////////////////////////
	// Template helpers.
	//////////////////////////////////////////////////////////////////

	var template_helpers = {

		/**
		 * @todo Documentation
		 *
		 * @param {integer} seconds Number of seconds of the duration.
		 * @param {integer=} precision Number of significant units to use.
		 *     (Default is 2).
		 *
		 * @return {string}
		 */
		'formatDuration': function(seconds, precision) {
			/* jshint bitwise:false */

			var units = [
				['years',   31556952], // 365.2425 days per year due to leap-years.
				['months',  2629746],  // Divided by 12 months.
				['days',    86400],    // 24 hours.
				['hours',   3600],     // 60 minutes.
				['minutes', 60],       // 60 seconds.
				['seconds', 1],
			];

			var i = 0;
			var n = units.length;

			precision = precision ? precision|0 : 2;

			// Find the first non null unit.
			while ((i < n) && (seconds < units[i][1]))
			{
				++i;
			}

			var parts = [];
			for (; i < n; ++i)
			{
				var m = (seconds / units[i][1])|0;
				seconds %= units[i][1];

				if (m)
				{
					parts.push(m + ' ' + units[i][0]);
				}

				if (--precision <= 0)
				{
					break;
				}
			}

			n = parts.length - 1;

			// Exactly one part.
			if (!n)
			{
				return parts[0];
			}

			// More than one part.
			return (parts.slice(0, n).join(', ') + ' and ' + parts[n]);
		},

		/**
		 * Helper for xo.formatDuration() which format the duration
		 * between a moment in the past and now.
		 *
		 * @param {integer} timestamp Unix timestamp of the past moment.
		 * @param {string=} precision Last unit that should be used
		 *     (Default is “seconds”).
		 *
		 * @return {string}
		 */
		'formatDuration_fromNow': function(timestamp, precision) {
			return this.formatDuration(
				Math.floor(Date.now() / 1000 - timestamp),
				precision
			);
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {integer} size [description]
		 * @param {string=} unit [description]
		 * @param {integer=} base
		 *
		 * @return string
		 */
		'formatSize': function(size, unit, base){
			/* jshint bitwise:false */

			size = +size;
			unit = (undefined !== unit) ? ''+unit : 'B';
			base = (undefined !== base) ? base|0 : 1024;

			var powers = ['', 'K', 'M', 'G', 'T', 'P'];

			for (var i = 0; size > base; ++i)
			{
				size /= base;
			}

			// Maximum 1 decimals.
			size = ((size * 10)|0) / 10;

			return (size + powers[i] + unit);
		},

		/**
		 *
		 */
		'link': function (label, path) {
			if (_.isArray(path))
			{
				path = path.join('/');
			}

			return [
				'<a href="#'+ path +'">',
				label,
				'</a>',
			].join('');
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {array} bars [description]
		 * @param {object=} options [description]
		 *
		 * @return string
		 */
		'progressBar': function (bars, options) {
			var has_labels = false;

			// Normalizes bars.
			if (!_.isArray(bars))
			{
				bars = [bars];
			}
			_.each(bars, function (bar, i) {
				if (_.isNumber(bar))
				{
					bars[i] = bar = {
						'value': bar
					};
				}

				if ((bar.value = Math.round(bar.value)) <= 0)
				{
					bar.value += 100;
				}

				has_labels = has_labels || !!bar.label;

				_.defaults(bar, {
					'color': 'info',
					'title': bar.value +'%',
					'label': '',
				});
			});

			// Normalizes global options.
			if (!options)
			{
				options = {};
			}
			has_labels = has_labels || !!options.label;
			_.defaults(options, {
				'size': has_labels ? 'normal' : 'small',
				'title': (1 === bars.length) ? bars[0].title : '',
			});

			// HTML generation.
			var html = [
				'<div class="progress',
				(options.size in {'small':0, 'big':0}) // @todo Ugly.
					? ' progress-'+ options.size
					: '',
				'" title="', options.title, '">'];
			_.each(bars, function (bar) {
				html.push(
					'<div class="bar bar-', bar.color, '" title="', bar.title,
					'" style="width: ', bar.value, '%">', bar.label, '</div>'
				);
			});
			html.push(options.label, '</div>');

			return html.join('');
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} power_state [description]
		 *
		 * @return string
		 */
		'powerState': function () {
			var state_to_colors = {
				'Running': 'success',
				'Paused':  'info',
				'Halted':  'important',
			};

			var state = this.power_state;

			return [
				'<span class="label label-'+ state_to_colors[state] +'">',
				state,
				'</span>',
			].join('');
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} actionButtons [description]
		 *
		 * @return string
		 */
		'actionButtons': function () {
			switch (this.power_state)
			{
				case 'Running':
					return [
						'<button class="btn btn-small js-pause" data-id="'+this.uuid+'" title="Pause">',
						'<i class="icon-pause"></i></button> ',
						'<button class="btn btn-small js-clean-reboot" data-id="'+ this.uuid +'" title="Restart">',
						'<i class="icon-refresh"></i></button> ',
						'<button class="btn btn-small js-clean-shutdown" data-id="'+ this.uuid +'" title="Stop">',
						'<i class="icon-stop"></i></button>',
					].join('');
				case 'Paused':
					return '<button class="btn btn-small js-unpause" data-id="'+ this.uuid +'" title="Unpause"><i class="icon-play"></i></button>';
				case 'Halted':
					return '<button class="btn btn-small js-start" data-id="'+ this.uuid +'" title="Start"><i class="icon-play"></i></button>';
			}
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} actionButtons [description]
		 *
		 * @return string
		 */
		'stateSigns': function () {
			switch (this.power_state)
			{
				case 'Running':
					return '<p class="center"><i class="icon-circle-blank" title="Status: running" style="color:green;"></i></p>';
				case 'Paused':
					return '<p class="center"><i class="icon-circle-blank" title="Status: paused" style="color:#005599"></i></p>';
				case 'Halted':
					return '<p class="center"><i class="icon-circle-blank" title="Status: halted" style="color:#d60000"></i></p>';
				default:
					return '<p class="center"><i class="icon-circle-blank" title="Status: unknown" style="color:black"></i></p>';
			}
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {boolean} currently_attached [description]
		 *
		 * @return string
		 */
		'linkState': function () {
			if (this.currently_attached) {
				return '<span class="label label-success">Connected</span>';
			}

			return '<span class="label label-important">Not connected</span>';
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {boolean} truth [description]
		 *
		 * @return string
		 */
		'yesNo': function (truth) {
			return (truth ? 'Yes' : 'No');
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} selected Selected permission if any.
		 *
		 * @return string
		 */
		'permissionsList': function (selected) {
			var perms = {
				'none': 'None',
				'read': 'Read',
				'write': 'Write',
				'admin': 'Administration',
			};

			if (!selected)
			{
				selected = this.permission;
			}

			var html = [];
			for (var perm in perms)
			{
				html.push('<option value="', perm, '"');
				if (selected === perm)
				{
					html.push(' selected="selected"');
				}
				html.push('>', perms[perm], '</option>');
			}
			return html.join('');
		},

	};

	//////////////////////////////////////////////////////////////////
	// Models.
	//////////////////////////////////////////////////////////////////

	var User = Backbone.Model.extend({});

	//----------------------------------------------------------------
	// Xen objects.
	//----------------------------------------------------------------

	var Pool = Backbone.Model.extend({});
	var Host = Backbone.Model.extend({});
	var VM = Backbone.Model.extend({});

	var Network = Backbone.Model.extend({});
	var SR = Backbone.Model.extend({});
	var VDI = Backbone.Model.extend({});

	var PIF = Backbone.Model.extend({});
	var VIF = Backbone.Model.extend({});

	//////////////////////////////////////////////////////////////////
	// Dependencies between models.
	//////////////////////////////////////////////////////////////////

	//
	var dependencies = {
		'pool': {
			'sr': [
				'crash_dump_SR',
				'default_SR',
				'suspend_image_SR',
			],
			'host': 'master',
		},
		'host': {
			'sr': [
				'crash_dump_sr',
				'default_sr',
				'suspend_image_SR',
			],
			'host': 'resident_VMs',
			'pool': 'pool_uuid',
		},
		'vm': {
			'host': [
				'affinity',
				'resident_on',
			],
			'vm': [
				'children',
				'parent',
				'snapshot_of',
			],
			'sr': 'suspend_SR',
			'vif': 'VIFs',
		},

		'network': {
			'pif': 'PIFs',
			'vif': 'VIFs',
		},
		'sr': {
		},
		'vdi': {
		},
		'pif': {
			'network': 'network',
			'vm': 'VMs',
		},
		'vif': {
			'host': 'host',
			'network': 'network',
		},
	};

	//////////////////////////////////////////////////////////////////
	// Collections.
	//////////////////////////////////////////////////////////////////

	var Users = Backbone.Collection.extend({
		'model': User,
		'comparator': function (user) {
			return user.get('email').toLowerCase();
		},
	});

	var Pools = Backbone.Collection.extend({
		'model': Pool,
		'comparator': function (pool) {
			return pool.get('name_label').toLowerCase();
		},
	});

	var Hosts = Backbone.Collection.extend({
		'model': Host,
		'comparator': function (a, b) {
			a = a.get('name_label');
			b = b.get('name_label');

			// No label means it is the special entry “no host”.
			// Push it at the end.
			if (!a) { return 1; }
			if (!b) { return -1; }

			if (a.toLowerCase() <= b.toLowerCase())
			{
				return -1;
			}
			return 1;
		},
	});

	var VMs = Backbone.Collection.extend({
		'model': VM,
		'comparator': function (vm) {
			return vm.get('name_label').toLowerCase();
		},
	});

	var Networks = Backbone.Collection.extend({
		'model': Network,
	});

	var SRs = Backbone.Collection.extend({
		'model': SR,

		'comparator': function (sr) {
			return -sr.get('physical_size');
		},
	});

	var VDIs = Backbone.Collection.extend({
		'model': VDI,
	});

	var PIFs = Backbone.Collection.extend({
		'model': PIF,
	});

	var VIFs = Backbone.Collection.extend({
		'model': VIF,
	});

	//////////////////////////////////////////////////////////////////
	// Views.
	//////////////////////////////////////////////////////////////////

	var _serializeData = function () {
		function escape(object)
		{
			for (var property in object)
			{
				if (!object.hasOwnProperty(property))
				{
					continue;
				}

				var value = object[property];
				if (_.isString(value))
				{
					object[property] = _.escape(value);
				}
				else if (_.isObject(value)
					&& !(value instanceof Backbone.Collection)
					&& !(value instanceof Backbone.Model))
				{
					object[property] = value = _.clone(value);
					escape(value);
				}
			}
		}

		return function () {
			if (this.model)
			{
				var data = this.model.toJSON();
				escape(data);
				return data;
			}

			return {};
		};
	}();

	var _constructor = function (super_constructor) {
		return function (options) {
			if (!options)
			{
				options = {};
				Array.prototype.push.call(arguments, options);
			}

			// Classes and id can be defined directly in the template
			// element.
			var tpl = options.template || this.template;
			if (tpl)
			{
				var $tpl = $(tpl);

				_.each({
					'id': 'id',
					'tag': 'tagName',
					'class': 'className',
					'items-container': 'itemViewContainer',
				}, function (entry, attr) {
					var value;
					if (!options[entry]
						&& (value = $tpl.attr('data-'+ attr)))
					{
						options[entry] = value;
					}
				});
			}

			// Due to Marionette.CompositeItem's implementation, the
			// “itemViewContainer” must be directly defined on the
			// object.
			if (options.itemViewContainer)
			{
				this.itemViewContainer = options.itemViewContainer;
			}

			super_constructor.apply(this, arguments);

			// Re-render when the model changes.
			if (this.model && (false !== this.listenToModelChange))
			{
				this.listenTo(this.model, 'change', this.render);
			}
		};
	};

	var ItemView = Backbone.Marionette.ItemView.extend({
		'templateHelpers': template_helpers,

		'constructor': _constructor(Backbone.Marionette.ItemView),

		'serializeData': _serializeData,
	});

	var CompositeView = Backbone.Marionette.CompositeView.extend({
		'templateHelpers': template_helpers,

		'constructor': _constructor(Backbone.Marionette.CompositeView),

		'serializeData': _serializeData,
	});

	var LayoutView = Backbone.Marionette.Layout.extend({
		'template_helpers': template_helpers,

		'constructor': _constructor(Backbone.Marionette.Layout),

		'serializeData': _serializeData,
	});

	var CollectionView = Backbone.Marionette.CollectionView.extend({});

	//////////////////////////////////////////////////////////////////

	var AlertView = ItemView.extend({
		'template': '#tpl-alert',

		'events': {
			// We do not use Bootstrap alerts, just the CSS.
			'click .close': function () {
				this.model.collection.remove(this.model);
			},
		},
	});

	//----------------------------------------------------------------

	var SessionView = ItemView.extend({
		'template': '#tpl-session',

		'initialize': function () {
			// @todo Move in application initialization because it can
			// currently cause race conditions.
			var token = window.localStorage.getItem('token');
			if (!token)
			{
				return;
			}

			var xo = app.xo;
			xo.call('session.signInWithToken', {'token': token}).then(function () {
				xo.call('session.getUserId').then(function (user_id) {
					return xo.call('user.get', {'id': user_id});
				}).then(function (user) {
					app.user.set(user);
				}).fail(function (e) {
					app.alert({'message': e.message});
				});
			}).fail(function () {
				// @todo Check error.

				window.localStorage.removeItem('token');
			});
		},

		'events': {
			'submit form': function (e) {
				e.preventDefault();

				var values = {};
				_.each($(e.target).serializeArray(), function (entry) {
					values[entry.name] = entry.value;
				});

				var xo = app.xo;
				xo.call('session.signInWithPassword', values).then(function () {
					// @todo Fill this array.
					var promises = [];

					xo.call('session.getUserId').then(function (user_id) {
						return xo.call('user.get', {'id': user_id});
					}).then(function (user) {
						app.user.set(user);
					});

					xo.call('token.create').then(function (token) {
						window.localStorage.setItem('token', token);
					});
				}).fail(function () {
					// @todo Check error.

					app.alert({
						'title': 'Authentication failure',
						'message': 'Could not authenticate you with the ' +
							'information you provided.'
					});
				});
			},

			'click .js-sign-out': function (e) {
				e.preventDefault();

				// To sign out we only have to create a new connection.
				app.xo = app.xo.clone();

				app.user.clear();
				window.localStorage.removeItem('token');
			},
		}
	});

	//----------------------------------------------------------------

	var AdminUsersItemView = ItemView.extend({
		'template': '#tpl-admin-users-item',
	});
	var AdminUsersView = CompositeView.extend({
		'template': '#tpl-admin-users',

		'itemView': AdminUsersItemView,

		'events': {
			'submit .js-update-users': function (e) {
				e.preventDefault();
				var $form = $(e.target);

				var DELETE = /^delete\[(.+)\]$/;
				var UPDATE = /^(permission)\[(.+)\]$/;
				var to_delete = {};
				var to_update = {};
				_.each($form.serializeArray(), function (field) {
					var match;
					if (match = field.name.match(DELETE))
					{
						var id = match[1];
						to_delete[id] = true;
						delete to_update[id];
					}
					else if (match = field.name.match(UPDATE))
					{
						var id = match[2];
						if (!to_delete[id])
						{
							if (!to_update[id])
							{
								to_update[id] = {};
							}
							to_update[id][match[1]] = field.value;
						}
					}
				});

				var promises = [];
				_.each(to_delete, function (val, id) {
					promises.push(app.xo.call('user.delete', {'id': id}));
				});
				_.each(to_update, function (values, id) {
					values.id = id;
					promises.push(app.xo.call('user.set', values));
				});

				var collection = this.collection;
				Q.all(promises).then(function () {
					return app.xo.call('user.getAll');
				}).then(function (users) {
					collection.set(users);
				}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},

			'submit .js-create-user': function (e) {
				e.preventDefault();
				var $form = $(e.target);

				var values = {};
				_.each($form.serializeArray(), function (entry) {
					values[entry.name] = entry.value;
				});
				$form[0].reset();

				var collection = this.collection;
				app.xo.call('user.create', values).then(function () {
					return app.xo.call('user.getAll');
				}).then(function (users) {
					collection.set(users);
				}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
		},
	});

	//----------------------------------------------------------------

	var StatsView = ItemView.extend({
		'template': '#tpl-stats',
	});

	//----------------------------------------------------------------

	var OverviewView = ItemView.extend({
		'template': '#tpl-overview',

		'onDomRefresh': function () {

			// @todo Binds to real data.
			var data = [
				{
					"label": "Pool 1",
					"hosts": [
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
								{ "label": "VM 6" },
								{ "label": "VM 7" },
								{ "label": "VM 8" },

							]
						},
						{
							"label": "Host 2",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
							]
						},
					]
				},
				{
					"label": "Pool 2",
					"hosts": [
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
								{ "label": "VM 6" },
								{ "label": "VM 7" },
							]
						}
					]
				},
				{
					"label": "Pool 3",
					"hosts": [
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
					]
				},
				{
					"label": "Pool 4",
					"hosts": [
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
						{
							"label": "Host 2",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
							]
						},
					]
				},
				{
					"label": "Pool 5",
					"hosts": [
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
					]
				},
				{
					"label": "Pool 6",
					"hosts": [
						{
							"label": "Host 1",
							"vms": [
								{ "label": "VM 1" },
								{ "label": "VM 2" },
								{ "label": "VM 3" },
								{ "label": "VM 4" },
								{ "label": "VM 5" },
							]
						},
					]
				},

			];

			// app.pools.each(function (pool) {
			// 	var pool_ = {
			// 		'id': pool.get('uuid'),
			// 		'label': pool.get('name_label'),
			// 	};

			// 	app.
			// })

			//------------------

			var width = 800;
			var height = 600;

			var svg = d3.select(this.$('svg')[0])
				.attr('class', 'network-graph')
				.attr('width', width)
				.attr('height', height)
			;

			svg.append('g')
				.attr('transform', 'translate('+ width/2 +', '+ height/2 +')')
				.datum(data)
				.call(network_graph().width(width).height(height))
			;
		},
	});

	//----------------------------------------------------------------

	var HostsListItemView = ItemView.extend({
		'template': '#tpl-hosts-list-item',
	});
	var HostsListView = CompositeView.extend({
		'template': '#tpl-hosts-list',


		// @todo For plain item-view we could configure its template
		// directly into thte HTML (e.g. “data-item-template”
		// attribute).
		'itemView': HostsListItemView,

		'initialize': function () {
			this.collection = this.model.get('hosts');
		},
	});

	//----------------------------------------------------------------

	var HostView = CompositeView.extend({
		'template': '#tpl-host',

		'itemView': ItemView,
		'itemViewOptions': function (model) {
			return {
				'model': this.model,
				'template': model.get('template'),
			};
		},

		'events': {
			'click .nav-tabs a': function (e) {
				e.preventDefault();
				$(e.target).tab('show');
			},
		},

		'listenToModelChange': false,
		'initialize': function () {
			this.collection = new Backbone.Collection([
				{'template': '#tpl-host-general'},
				//{'template': '#tpl-host-memory'}, @todo
				//{'template': '#tpl-host-storage'}, @todo
				//{'template': '#tpl-host-network'}, @todo
			]);

			// Only re-render on name change.
			// @todo Find a cleaner way.
			this.listenTo(this.model, 'change:name_label', this.render);
		},
	});

	//----------------------------------------------------------------

	var VMsListItemView = ItemView.extend({
		'template': '#tpl-vms-list-item',
	});
	var VMsListView = CompositeView.extend({
		'template': '#tpl-vms-list',

		'itemView': VMsListItemView,

		'events': {
			'click .js-pause': function(e) {
				e.preventDefault();
				var vm_id = $(e.target).attr('data-id');
				app.xo.call('xapi.vm.pause', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-unpause': function(e) {
				e.preventDefault();
				var vm_id = $(e.target).attr('data-id');
				app.xo.call('xapi.vm.unpause', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-clean-reboot': function(e) {
				e.preventDefault();
				var vm_id = $(e.target).attr('data-id');
				app.xo.call('xapi.vm.reboot', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-start': function(e) {
				e.preventDefault();
				var vm_id = $(e.target).attr('data-id');
				app.xo.call('xapi.vm.start', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-clean-shutdown': function(e) {
				e.preventDefault();
				var vm_id = $(e.target).attr('data-id');
				app.xo.call('xapi.vm.shutdown', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
		},
		'initialize': function () {
			this.collection = this.model.get('vms');
		},
	});

	//----------------------------------------------------------------

	// @todo Do not load this view before necessary.
	var VMConsoleView = ItemView.extend({
		'template': '#tpl-vm-console',

		'initialize': function () {
			var view = this;


			if ('Running' !== this.model.get('power_state'))
			{
				return;
			}

			var vm_console = _.findWhere(this.model.get('consoles'), {
				'protocol': 'rfb',
			});

			// @todo Comment.
			var parse_url = function (url) {
				var a = window.document.createElement('a');
				a.href = url;

				return {
					'host': a.hostname,
					'port': a.port || ('https:' === a.protocol) ? 443 : 80,
					'path': a.pathname,
					'query': a.search,
				};
			};
			var url = parse_url(vm_console.location);
			var pool = app.pools.get(this.model.get('pool_uuid'));
			url.query += '&session_id='+ pool.get('sessionId');

			view.on('dom:refresh', function () {
				view.rfb = new window.RFB({
					// Options.
					'encrypt': false,
					'target': view.$('canvas')[0],

					// Callbacks.
					'onPasswordRequired': function (rfb) {
						rfb.sendPassword(window.prompt('password:'));
					},
					'onUpdateState': function () {
						console.log(arguments);
					},
				});

				view.rfb.connect(
					url.host,
					80,
					'',
					url.path.substr(1) + url.query
				);
			});
		},

		'onBeforeClose': function () {
			this.rfb && this.rfb.disconnect();
		},
	});
	var VMView = CompositeView.extend({
		'template': '#tpl-vm',

		'getItemView': function (model) {
			return model && model.get('view') || ItemView;
		},
		'itemViewOptions': function (model) {
			return {
				'model': this.model,
				'template': model.get('template'),
			};
		},

		'events': {
			'click .nav-tabs a': function (e) {
				e.preventDefault();
				$(e.target).tab('show');
			},
		},

		'listenToModelChange': false,
		'initialize': function () {
			this.collection = new Backbone.Collection([
				{'template': '#tpl-vm-general'},
				{'template': '#tpl-vm-cpu'},
				{'template': '#tpl-vm-memory'},
				{'template': '#tpl-vm-storage'},
				{'template': '#tpl-vm-network'},
				{'view': VMConsoleView},
				{'template': '#tpl-vm-snapshots'},
				{'template': '#tpl-vm-logs'},
				{'template': '#tpl-vm-other'},
			]);

			// Only re-render on name change.
			// @todo Find a cleaner way.
			this.listenTo(this.model, 'change:name_label', this.render);
		},
	});

	var VMNewView = ItemView.extend({
		'template': '#tpl-vm-new',
		// prevent wizard to use '#' links in prev/next/etc. button
		'events': {
			'click .next, .previous, .last, .first': function (e) {
				e.preventDefault();
			},
		},

		'onDomRefresh': function () {
			this.$el.bootstrapWizard({'tabClass': 'nav nav-tabs'});
			this.$('select').select2();
		},
	});

	//----------------------------------------------------------------

	var NetworksListItemView = ItemView.extend({
		'template': '#tpl-networks-list-item'
	});
	var NetworksListView = CompositeView.extend({
		'template': '#tpl-networks-list',

		'itemView': NetworksListItemView,

		'initialize': function () {
			this.collection = this.model.get('networks');
		},
	});

	//----------------------------------------------------------------

	var SRsListItemView = ItemView.extend({
		'template': '#tpl-storages-list-item'
	});
	var SRsListView = CompositeView.extend({
		'template': '#tpl-storages-list',

		'itemView': SRsListItemView,

		'initialize': function () {
			this.collection = this.model.get('srs');
		},
	});

	//----------------------------------------------------------------

	var TemplatesListItemView = ItemView.extend({
		'template': '#tpl-templates-list-item'
	});
	var TemplatesListView = CompositeView.extend({
		'template': '#tpl-templates-list',

		'itemView': TemplatesListItemView,
		'itemViewContainer': 'tbody',

		'initialize': function () {
			this.collection = this.model.get('templates');
		},
	});

	//////////////////////////////////////////////////////////////////
	// Router.
	//////////////////////////////////////////////////////////////////

	var Router = Backbone.Router.extend({
		'routes': {
			'': 'home',
			'overview': 'overview',

			'admin/users': 'admin_users',

			'hosts': 'hosts_listing',
			'hosts/:uuid': 'host_show',
			// //'hosts/:uuid/edit': 'host_edit',

			'networks': 'networks_listing',
			// 'networks/:uuid': 'network_show',
			// //'networks/:uuid/edit': 'network_edit',

			'storages': 'storages_listing',
			// 'storages/:uuid': 'storage_show',
			// //'storages/:uuid/edit': 'storage_edit',

			'templates': 'templates_listing',
			// 'templates/:uuid': 'template_show',
			// //'templates/:uuid/edit': 'template_edit',

			'vms': 'vms_listing',
			'vms/new': 'vm_new',
			'vms/:uuid': 'vm_show',
			//'vms/:uuid/edit': 'vm_edit',


			// Default route.
			'*path': 'not_found',
		},

		'home': function () {
			// @todo Use events instead of pooling.
			var refresh = function () {
				app.xo.call('xo.getStats').then(function (stats) {
					app.stats.set(stats);
				}).fail(function (e) {
					app.alert({'message': e.message});
				});
			};

			var interval;
			app.main.show(new StatsView({
				'model': app.stats,

				'onBeforeClose': function () {
					window.clearInterval(interval);
				},
			}));

			refresh();
			interval = window.setInterval(refresh, 1000);
		},

		'overview': function () {
			app.main.show(new OverviewView());
		},

		'admin_users': function () {
			var users = new Users();

			app.xo.call('user.getAll').then(function (users_) {
				users.set(users_);
			}).fail(function (e) {
				app.alert({'message': e.message});
			});

			app.main.show(new AdminUsersView({
				'collection': users,
			}));
		},

		'hosts_listing': function () {
			var hosts = app.hosts.groupBy('pool_uuid');

			_.each(hosts, function (hosts, uuid) {
				var pool = app.pools.get(uuid);

				pool.set('hosts', new Hosts(hosts));
			});

			app.main.show(new CollectionView({
				'collection': app.pools,
				'itemView': HostsListView,
			}));
		},

		'host_show': function (uuid) {
			var host = app.hosts.get(uuid);
			if (!host)
			{
				return this.error_page('No such host: '+ uuid);
			}

			app.main.show(new HostView({'model': host}));
		},

		'vms_listing': function () {
			var hosts = app.hosts.subset();

			var vms = app.vms;
			hosts.each(function (host) {
				var id = host.id;
				var subset = vms.subset(function (vm) {
					return (
						(vm.get('is_control_domain') === false)
						&& (vm.get('resident_on') === id)
					);
				});
				host.set('vms', subset);
			});

			// No host.
			hosts.add({
				'uuid': '', // @todo Check why it is necessary.
				'vms': vms.subset(function (vm) {
					return (
						(vm.get('is_a_template') === false)
						&& (vm.get('resident_on') === null)
					);
				})
			});

			app.main.show(new CollectionView({
				'collection': hosts,
				'itemView': VMsListView,
			}));
		},

		'vm_show': function (uuid) {
			var vm = app.vms.get(uuid);
			if (!vm)
			{
				return this.error_page('No such vm: '+ uuid);
			}

			var guest_metrics = vm.get('guest_metrics');
			var tmp;
			vm.set({
				'host': (tmp = vm.get('resident_on'))
					? app.hosts.get(tmp).attributes
					: null,
				'memory': {
					'used': guest_metrics && guest_metrics.memory.free
						? guest_metrics.memory.free
						: null,
					'total': guest_metrics && guest_metrics.memory.total
						? guest_metrics.memory.total
						: vm.get('metrics').memory_actual,
				},
				'preferred_host': (tmp = vm.get('affinity'))
					? app.hosts.get(tmp).attributes
					: null,
			});
			app.main.show(new VMView({'model': vm}));
		},

		'vm_new': function () {
			app.main.show(new VMNewView());
		},

		'storages_listing': function () {
			var srs = app.srs.groupBy('pool_uuid');

			_.each(srs, function (srs, uuid) {
				var pool = app.pools.get(uuid);

				pool.set('srs', new SRs(srs));
			});

			app.main.show(new CollectionView({
				'collection': app.pools,
				'itemView': SRsListView,
			}));
		},

		'networks_listing': function () {
			var networks = app.srs.groupBy('pool_uuid');

			_.each(networks, function (networks, uuid) {
				var pool = app.pools.get(uuid);

				pool.set('networks', new Networks(networks));
			});

			app.main.show(new CollectionView({
				'collection': app.pools,
				'itemView': NetworksListView,
			}));
		},

		'templates_listing': function () {
			var templates = _.groupBy(app.vms.where({
				'is_a_template': true,
			}), function (template) {
				return template.get('pool_uuid');
			});

			_.each(templates, function (templates, uuid) {
				var pool = app.pools.get(uuid);

				pool.set('templates', new VMs(templates));
			});

			app.main.show(new CollectionView({
				'collection': app.pools,
				'itemView': TemplatesListView,
			}));
		},

		'not_found': function (path) {
			return this.error_page('No such page: '+ path);
		},

		'error_page': function (message) {
			alert(message);
			this.navigate('', {
				'trigger': true,
				'replace': true,
			});
		}
	});

	//////////////////////////////////////////////////////////////////
	// Application.
	//////////////////////////////////////////////////////////////////

	var app = new Backbone.Marionette.Application();

	app.addRegions({
		'alerts': '#reg-alerts',
		'main': '#reg-main',
		'session': '#reg-session',
	});

	app.addInitializer(function (options) {
		var app = this;

		app.xo = options.xo;

		//--------------------------------------

		var Alert = Backbone.Model.extend({
				'defaults': {
					'title': '',
					'message': '',
				},
		});
		var alerts = new Backbone.Collection();

		app.alert = function (data) {
			alerts.add(new Alert(data));
			console.trace()
		};

		// @todo Implements session persistence using token and local
		// storage.
		app.user = new Backbone.Model({});

		app.stats = new Backbone.Model({
			'hosts': 'N/A',
			'vms': 'N/A',
			'running_vms': 'N/A',
			'memory': 'N/A',
			'vcpus': 'N/A',
			'vifs': 'N/A',
			'srs': 'N/A',
		});

		app.pools = new Pools();
		app.hosts = new Hosts();
		app.vms = new VMs();

		app.networks = new Networks();
		app.srs = new SRs();
		app.vdis = new VDIs();

		app.vifs = new VIFs();
		app.pifs = new PIFs();

		//--------------------------------------

		// @todo Use Backbone.sync.

		var refresh = function () {
			var promises = [];

			_.each([
				'pool', 'host', 'vm',

				'network', 'sr', 'vdi',

				'pif', 'vif',
			], function (klass) {
				promises.push(
					app.xo.call('xapi.'+ klass +'.getAll').then(function (items) {
						app[klass +'s'].set(items);
					})
				);
			});

			return Q.all(promises).then(function () {
				// @todo Objects linkage.
				// _.each(dependencies, function (deps, source_class) {

				// 	// For each model of source_class.
				// 	_.each(app[source_class +'s'].models, function (model) {

				// 		// For each target classes.
				// 		_.each(deps, function (props, target_class) {
				// 			if (!_.isArray(props))
				// 			{
				// 				props = [props];

				// 				// Avoids repeating this action at each loop.
				// 				deps[target_class] = props;
				// 			}

				// 			var coll = app[target_class +'s'];

				// 			// Resolve each property.
				// 			_.each(props, function (prop) {
				// 				var val = model.get(prop);

				// 				// If it is an array, make it a collection.
				// 				if (_.isArray(val))
				// 				{
				// 					var tmp = new coll.constructor();
				// 					_.each(val, function (uuid) {
				// 						tmp.add(coll.get(uuid));
				// 					});
				// 				}
				// 				else
				// 				{
				// 					val = coll.get(val);
				// 				}
				// 			});

				// 		});
				// 	});
				// });
			});
		};

		refresh().then(function () {
			Backbone.history.start();
		}).done();

		// @todo Implement events.
		window.setInterval(refresh, 1000);

		//--------------------------------------
		// Binds actions to global objects.

		$('#modal-new-server form').submit(function (e) {
			e.preventDefault();

			var $this = $(this);
			var values = {};
			_.each($this.serializeArray(), function (entry) {
				values[entry.name] = entry.value;
			});
			app.xo.call('server.add', values).fail(function (e) {
				app.alert({'message': e.message});
			});

			$('#modal-new-server').modal('hide');
		});
		$('#modal-new-server').on('hidden', function () {
			$(this).find('form')[0].reset();
		});

		//--------------------------------------

		app.alerts.show(new CollectionView({
			'itemView': AlertView,
			'collection': alerts,
		}));
		app.session.show(new SessionView({
			'model': app.user,
		}));
		//--------------------------------------

		/* jshint nonew:false */
		new Router();
	});

	//////////////////////////////////////////////////////////////////

	$(function () {
		var loc = window.location;

		app.start({
			'xo': new XO('ws://'+ loc.host + loc.pathname +'api/'),
		});
	});
})(window.Q, window._, window.jQuery, window.Backbone);
