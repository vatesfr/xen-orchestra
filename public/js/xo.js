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
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

 // @todo Use Q promises.

(function (_, $, Backbone, undefined) {
	'use strict';

	//////////////////////////////////////////////////////////////////
	// Connection to XO.
	//////////////////////////////////////////////////////////////////

	var XO = function (url) {
		var xo = this;

		// Identifier of the next request.
		var next_id = 0;

		// Callbacks called when a response arrive.
		var callbacks = {};

		// When the socket is closed, request are enqueued.
		var queue = [];

		// Websocket used to connect to XO-Server.
		var socket = new WebSocket(url);

		// Function used to send requests when the socket is opened.
		var send = function (method, params, callback) {
			var id = next_id++;

			if (callback)
			{
				callbacks[id] = callback;
			}

			socket.send(JSON.stringify({
				'jsonrpc': '2.0',
				'id': id,
				'method': method,
				'params': params || [],
			}));
		};

		// Function used to enqueue requests when the socket is closed.
		var enqueue = function  (method, params, callback) {
			queue.push([method, params, callback]);
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
		// callback (if any).
		socket.addEventListener('message', function (event) {
			var response = JSON.parse(event.data.toString());

			var id = response.id;
			var callback = callbacks[id];
			if (!callback)
			{
				// No callback associated: nothing to do.
				return;
			}
			delete callbacks[id];

			var error = response.error;
			if (undefined !== error)
			{
				callback(error);
				return;
			}

			var result = response.result;
			if (undefined === result)
			{
				/* jshint devel:true */
				console.warn(
					'a message with no error nor result has been received ',
					response
				);
				return;
			}

			callback(null, result);
		});

		// @todo What to do if there is an error in the websocket.
		socket.addEventListener('error', function (error) {
			console.error(error);
		});

		// The default way to send a request is by enqueuing it.
		xo.call = enqueue;
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
			/* jshint laxbreak:true */

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

				if ((bar.value = Math.round(bar.value)) < 0)
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
		 * @param {boolean} truth [description]
		 *
		 * @return string
		 */
		'yesNo': function (truth) {
			return (truth ? 'Yes' : 'No');
		},
	};

	//////////////////////////////////////////////////////////////////
	// Models.
	//////////////////////////////////////////////////////////////////

	//----------------------------------------------------------------
	// Xen objects.
	//----------------------------------------------------------------

	var Pool = Backbone.Model.extend({});
	var Host = Backbone.Model.extend({});
	var VM = Backbone.Model.extend({});

	// var Network = Backbone.Model.extend({});
	// var SR = Backbone.Model.extend({});
	// var VDI = Backbone.Model.extend({});

	//////////////////////////////////////////////////////////////////
	// Collections.
	//////////////////////////////////////////////////////////////////

	var Pools = Backbone.Collection.extend({
		'model': Pool,
	});

	var Hosts = Backbone.Collection.extend({
		'model': Host,
	});

	var VMs = Backbone.Collection.extend({
		'model': VM,
	});

	// var Networks = Backbone.Collection.extend({
	// 	'model': Network,
	// });

	// var SRs = Backbone.Collection.extend({
	// 	'model': SR,
	// });

	// var VDIs = Backbone.Collection.extend({
	// 	'model': VDI,
	// });

	//////////////////////////////////////////////////////////////////
	// Views.
	//////////////////////////////////////////////////////////////////

	var _serializeData = function () {
		function escape(object)
		{
			/* jshint laxbreak:true */

			for (var property in object) {
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
			// Classes and id can be defined directly in the template element.
			var tpl = options.template || this.template;
			if (tpl)
			{
				var val;
				var $tpl = $(tpl);

				if (!options.id && (val = $tpl.attr('data-id')))
				{
					options.id = val;
				}
				if (!options.tagName && (val = $tpl.attr('data-tag')))
				{
					options.tagName = val;
				}
				if (!options.className && (val = $tpl.attr('data-class')))
				{
					options.className = val;
				}
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

	var StatsView = ItemView.extend({
		'template': '#tpl-stats',
	});

	//----------------------------------------------------------------

	var HostsListItemView = ItemView.extend({
		'template': '#tpl-hosts-list-item',
	});
	var HostsListView = CompositeView.extend({
		'template': '#tpl-hosts-list',

		'itemView': HostsListItemView,
		'itemViewContainer': 'tbody',

		'initialize': function () {
			this.collection = this.model.get('hosts');
		},
	});
	var PoolView = CollectionView.extend({
		'itemView': HostsListView,
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
		'itemViewContainer': '.tab-content',

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
				{'template': '#tpl-host-memory'},
				{'template': '#tpl-host-storage'},
				{'template': '#tpl-host-network'},
			]);

			// Only re-render on name change.
			// @todo Find a cleaner way.
			this.listenTo(this.model, 'change:name', this.render);
		},
	});

	//----------------------------------------------------------------

	var VMsListItemView = ItemView.extend({
		'template': '#tpl-vms-list-item',
	});
	var VMsListView = CompositeView.extend({
		'template': '#tpl-vms-list',

		'itemView': VMsListItemView,
		'itemViewContainer': 'tbody',

		'initialize': function () {
			this.collection = this.model.get('vms');
		},
	});

	//////////////////////////////////////////////////////////////////
	// Router.
	//////////////////////////////////////////////////////////////////

	// @todo Puts this model in a controller.
	var stats;

	var Router = Backbone.Router.extend({
		'routes': {
			'': 'home',

			'hosts': 'hosts_listing',
			'hosts/:id': 'host_show',
			// //'hosts/:id/edit': 'host_edit',

			// 'networks': 'networks_listing',
			// 'networks/:id': 'network_show',
			// //'networks/:id/edit': 'network_edit',

			// 'storages': 'storages_listing',
			// 'storages/:id': 'storage_show',
			// //'storages/:id/edit': 'storage_edit',

			// 'templates': 'templates_listing',
			// 'templates/:id': 'template_show',
			// //'templates/:id/edit': 'template_edit',

			'vms': 'vms_listing',
			// 'vms/:id': 'vm_show',
			//'vms/:id/edit': 'vm_edit',


			// Default route.
			'*path': 'not_found',
		},

		'home': function () {
			if (!stats)
			{
				stats = new Backbone.Model({
					'hosts': 'N/A',
					'vms': 'N/A',
					'running_vms': 'N/A',
					'memory': 'N/A',
					'vcpus': 'N/A',
					'vifs': 'N/A',
					'srs': 'N/A',
				});
			}
			app.main.show(new StatsView({'model': stats}));

			// @todo Improve.
			xo.call('xo.getStats', null, function (error, result) {
				stats.set(result);
			});
		},

		'hosts_listing': function () {
			// @todo Gets data from XO-Server.
			var pools = new Pools([
				{
					'id': 0,
					'name': 'Pool 1',
					'hosts': new Hosts([
						{
							'id': 0,
							'name': 'Host 1',
							'description': 'no description',
							'memory': {
								'free': 1024,
								'total': 4096
							},
							'IPs': {},
							'start_time': 0,
						},
						{
							'id': 1,
							'name': 'Host 2',
							'description': 'no description',
							'memory': {
								'free': 3192,
								'total': 4096
							},
							'IPs': {},
							'start_time': Date.now()/1000 - 61,
						},
					]),
				},
				{
					'id': 1,
					'name': 'Pool 2',
					'hosts': new Hosts([
						{
							'id': 2,
							'name': 'Host 1',
							'description': 'no description',
							'memory': {
								'free': 1024,
								'total': 2048
							},
							'IPs': {},
							'start_time': 0,
						},
					]),
				},
			]);

			app.main.show(new PoolView({
				'collection': pools
			}));
		},

		'host_show': function (id) {
			var host = new Host({"CPUs":[],"control_domain":"cfd988d7-97a5-4d9e-9409-20853c74ac1f","description":"Default install of XenServer","enabled":true,"hostname":"andromeda","is_pool_master":false,"iscsi_iqn":null,"log_destination":"local","memory":{"free":"8057126912","total":"17143996416","per_VM":{"dom0":"777256960","ae0a235b-b5e5-105c-ed21-f97198cf1751":"2147483648","2f1647cf-54b8-9ee1-fb90-404680f25364":"3145728000","e87afeff-5921-116f-ec91-d772487ac5fe":"536870912","3ff02693-c481-3334-5676-5b74c684092f":"2147483648"}},"name":"andromeda","os_version":null,"PIFs":[{"currently_attached":true,"device":"82574L Gigabit Network Connection","duplex":false,"IP":"","MAC":"e4:11:5b:b7:f3:8f","name":"PIF #0","speed":"0","uuid":"e03acef7-2347-2c09-e6a8-9026e065cfcf","vendor":"Intel Corporation"},{"currently_attached":true,"device":"82574L Gigabit Network Connection","duplex":true,"IP":"88.190.41.127","MAC":"e4:11:5b:b7:f3:8e","name":"PIF #1","speed":"1000","uuid":"b190509e-6bf0-7306-0347-fa6932184853","vendor":"Intel Corporation"}],"SRs":[{"allocated":"0","description":"XenServer Tools ISOs","name":"XenServer Tools","shared":true,"total":"-1","type":"iso","used":"-1"},{"allocated":"0","description":"","name":"LocalISO","shared":false,"total":"-1","type":"iso","used":"-1"},{"allocated":"640289865728","description":"","name":"Local storage","shared":false,"total":"1991761723392","type":"lvm","used":"651002118144"},{"allocated":"0","description":"","name":"Removable storage","shared":false,"total":"0","type":"udev","used":"0"},{"allocated":"0","description":"Physical DVD drives","name":"DVD drives","shared":false,"total":"0","type":"udev","used":"0"}],"start_time":0,"tool_stack_start_time":0,"uuid":"1038e558-ce82-42d8-bf94-5c030cbeacd6","software_version":{"product_version":"6.2.0","product_version_text":"6.2","product_version_text_short":"6.2","platform_name":"XCP","platform_version":"1.8.0","product_brand":"XenServer","build_number":"70446c","hostname":"othone-2","date":"2013-06-14","dbv":"2013.0621","xapi":"1.3","xen":"4.1.5","linux":"2.6.32.43-0.4.1.xs1.8.0.835.170778xen","xencenter_min":"2.0","xencenter_max":"2.0","network_backend":"openvswitch","xs:xenserver-transfer-vm":"XenServer Transfer VM, version 6.2.0, build 70314c","xcp:main":"Base Pack, version 1.8.0, build 70446c","xs:main":"XenServer Pack, version 6.2.0, build 70446c"},"VMs":{"dom0":{"name":"Dom0"},"ae0a235b-b5e5-105c-ed21-f97198cf1751":{"name":"ald"},"2f1647cf-54b8-9ee1-fb90-404680f25364":{"name":"web1"},"e87afeff-5921-116f-ec91-d772487ac5fe":{"name":"shelter"},"3ff02693-c481-3334-5676-5b74c684092f":{"name":"cloud"}}});

			// @todo Gets data from XO-Server.
			app.main.show(new HostView({'model': host}));
		},

		'vms_listing': function () {
			var vms = [{"host_name":"andromeda","host_uuid":"1038e558-ce82-42d8-bf94-5c030cbeacd6","name_description":"ALD Vm with OC","name_label":"ald","networks":{"0\/ip":"88.191.245.126","0\/ipv6\/0":"2a01:e0b:1000:41:216:3eff:fe00:1fc","0\/ipv6\/1":"2a01:e0b:1000:27:216:3eff:fe00:1fc","0\/ipv6\/2":"fe80::216:3eff:fe00:1fc"},"power_state":"Running","start_time":1371682189,"total_memory":"2147483648","used_memory":null,"uuid":"ae0a235b-b5e5-105c-ed21-f97198cf1751","VBDs":3,"VCPUs_utilisation":[0],"VIFs":1},{"host_name":"andromeda","host_uuid":"1038e558-ce82-42d8-bf94-5c030cbeacd6","name_description":"","name_label":"web1","networks":{"0\/ip":"88.190.206.72","0\/ipv6\/0":"2a01:e0b:1000:41:216:3eff:fe00:1f","0\/ipv6\/1":"fe80::216:3eff:fe00:1f"},"power_state":"Running","start_time":1372809609,"total_memory":"3145728000","used_memory":null,"uuid":"2f1647cf-54b8-9ee1-fb90-404680f25364","VBDs":3,"VCPUs_utilisation":[0],"VIFs":1},{"host_name":"andromeda","host_uuid":"1038e558-ce82-42d8-bf94-5c030cbeacd6","name_description":"IRC and misc vm","name_label":"shelter","networks":{"0\/ip":"88.190.232.118","0\/ipv6\/0":"2a01:e0b:1000:41:216:3eff:fe00:e5","0\/ipv6\/1":"fe80::216:3eff:fe00:e5"},"power_state":"Running","start_time":1372763240,"total_memory":"536870912","used_memory":null,"uuid":"e87afeff-5921-116f-ec91-d772487ac5fe","VBDs":2,"VCPUs_utilisation":[],"VIFs":1},{"host_name":"andromeda","host_uuid":"1038e558-ce82-42d8-bf94-5c030cbeacd6","name_description":"ownCloud storage","name_label":"cloud","networks":{"0\/ip":"88.191.245.127","0\/ipv6\/0":"2a01:e0b:1000:41:216:3eff:fe00:1fd","0\/ipv6\/1":"fe80::216:3eff:fe00:1fd"},"power_state":"Running","start_time":1371673602,"total_memory":"2147483648","used_memory":null,"uuid":"3ff02693-c481-3334-5676-5b74c684092f","VBDs":3,"VCPUs_utilisation":[0],"VIFs":1}];

			vms = _.groupBy(vms, 'host_uuid');

			var hosts = [];
			_.each(vms, function (vms, id) {
				hosts.push({
					'id': id,
					'name': vms[0].host_name,
					'vms': new VMs(vms),
				});
			});

			app.main.show(new CollectionView({
				'collection': new Hosts(hosts),
				'itemView': VMsListView,
			}));
		},

		'not_found': function (path) {
			alert('no such page: '+ path);
			this.navigate('', {'trigger': true});
		},
	});

	//////////////////////////////////////////////////////////////////
	// Application.
	//////////////////////////////////////////////////////////////////

	var app = new Backbone.Marionette.Application();

	app.addRegions({
		'main': '#reg-main',
	});

	app.addInitializer(function () {
		/* jshint nonew:false */
		new Router();
	});

	app.on('initialize:after', function () {
		Backbone.history.start();
	});

	//////////////////////////////////////////////////////////////////

	var xo = new XO('ws://localhost:8080');

	$(function () {
		app.start();
	});
})(window._, window.jQuery, window.Backbone);
