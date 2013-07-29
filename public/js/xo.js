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
			if (2 === arguments.length)
			{
				callback = params;
				params = null;
			}

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
			if (2 === arguments.length)
			{
				callback = params;
				params = null;
			}

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
			var response = JSON.parse(event.data);

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
		 * @param {boolean} currently_attached [description]
		 *
		 * @return string
		 */
		'linkState': function () {
			if (this.currently_attached)
			{
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

	var Network = Backbone.Model.extend({});
	var SR = Backbone.Model.extend({});
	var VDI = Backbone.Model.extend({});

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

	var Networks = Backbone.Collection.extend({
		'model': Network,
	});

	var SRs = Backbone.Collection.extend({
		'model': SR,
	});

	var VDIs = Backbone.Collection.extend({
		'model': VDI,
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
			var view = this;

			// Classes and id can be defined directly in the template
			// element.
			var tpl = options.template || this.template;
			if (tpl)
			{
				var val;
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

	var StatsView = ItemView.extend({
		'template': '#tpl-stats',
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

		'initialize': function () {
			this.collection = this.model.get('vms');
		},
	});

	//----------------------------------------------------------------

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
					'port': a.port || ('https:' === a.protocol) ? 443 :80,
					'path': a.pathname,
					'query': a.search,
				};
			};
			var url = parse_url(vm_console.location);
			var pool = app.pools.get(this.model.get('pool_uuid'));
			url.query += '&session_id='+ pool.get('sessionId');

			console.log(url);

			view.on('dom:refresh', function () {
				view.rfb = new RFB({
					// Options.
					'encrypt': (443 === url.port),
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
					url.port,
					'',
					url.path.substr(1) + url.query
				);
			});
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

	//----------------------------------------------------------------

	var NetworksListItemView = ItemView.extend({
		'template': '#tpl-networks-list-item'
	});
	var NetworksListView = CompositeView.extend({
		'template': '#tpl-networks-list',

		'itemView': NetworksListItemView,

		'initialize': function () {
			//this.collection = this.model.get('storages');
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
			//this.collection = this.model.get('storages');
		},
	});

	//////////////////////////////////////////////////////////////////
	// Router.
	//////////////////////////////////////////////////////////////////

	var Router = Backbone.Router.extend({
		'routes': {
			'': 'home',

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
			'vms/:uuid': 'vm_show',
			//'vms/:uuid/edit': 'vm_edit',


			// Default route.
			'*path': 'not_found',
		},

		'home': function () {
			// @todo Use events instead of pooling.
			var refresh = function () {
				app.xo.call('xo.getStats', null, function (error, stats) {
					app.stats.set(stats);
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
			interval = window.setInterval(refresh, 5000);
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
			// @todo Correctly handle pools & hosts.
			var vms = _.groupBy(app.vms.where({
				'is_a_template': false,
				'is_control_domain': false,
			}), function (vm) {
				return vm.get('resident_on');
			});

			var hosts = [];
			_.each(vms, function (vms, uuid) {
				var host = ('null' !== uuid)
					? app.hosts.get(uuid)
					: new Host({'uuid': null});

				console.log(host.set('vms', new VMs(vms)));
				hosts.push(host);
			});

			app.main.show(new CollectionView({
				'collection': new Hosts(hosts),
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
			var networks = new Networks([{"currently_attached":false,"device":"82574L Gigabit Network Connection","duplex":false,"IP":"","MAC":"e4:11:5b:b7:f3:8f","name":"PIF #0","speed":"0","uuid":"e03acef7-2347-2c09-e6a8-9026e065cfcf","vendor":"Intel Corporation"},{"currently_attached":true,"device":"82574L Gigabit Network Connection","duplex":true,"IP":"88.190.41.127","MAC":"e4:11:5b:b7:f3:8e","name":"PIF #1","speed":"1000","uuid":"b190509e-6bf0-7306-0347-fa6932184853","vendor":"Intel Corporation"}]);

			app.main.show(new NetworksListView({
				'collection': networks
			}));
		},

		'templates_listing': function () {
			var templates = new Templates([{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows 8 (64-bit).","name":"Windows 8 (64-bit)","pool_uuid":null,"pool_name":null,"id":"0b31d5a2-7cda-3061-5c3a-4c62b64e7b17"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Ubuntu Maverick Meerkat 10.10 (32-bit) (experimental)","pool_uuid":null,"pool_name":null,"id":"b2fbdfd6-463b-044e-eb4b-f8810ee0752a"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Citrix XenApp on Windows Server 2003 (64-bit).","name":"Citrix XenApp on Windows Server 2003 (64-bit)","pool_uuid":null,"pool_name":null,"id":"d719d999-757d-c0ed-3ba6-b36cb8fc75c4"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 4.8 (32-bit)","pool_uuid":null,"pool_name":null,"id":"97ccc0e4-eb28-bfe2-eb65-ad2935b2df80"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows 7 (64-bit).","name":"Windows 7 (64-bit)","pool_uuid":null,"pool_name":null,"id":"681fe516-a66f-4058-0c7b-a1399482d478"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Server 2012 (64-bit).","name":"Windows Server 2012 (64-bit)","pool_uuid":null,"pool_name":null,"id":"0b1dab50-fe3f-d714-ff16-c68b5cc17121"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP2 (64-bit)","pool_uuid":null,"pool_name":null,"id":"8f41cf5d-d146-40a7-abca-2d0b8e091d46"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Ubuntu Precise Pangolin 12.04 (64-bit)","pool_uuid":null,"pool_name":null,"id":"d0522104-a23a-62fe-1ecf-e4f3320dd32a"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Server 2008 (64-bit).","name":"Windows Server 2008 (64-bit)","pool_uuid":null,"pool_name":null,"id":"b41d9c79-c9c1-9e21-40a5-09254ee758a9"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 11 SP1 (64-bit)","pool_uuid":null,"pool_name":null,"id":"39d575be-b41c-9cb5-ad74-894b55ee956f"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 4.7 (32-bit)","pool_uuid":null,"pool_name":null,"id":"fe5fddf6-ce3f-deef-1b9b-bf6ccc1665f0"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/\nIn order to install Debian Squeeze from CD\/DVD the multi-arch ISO image is required.","name":"Debian Squeeze 6.0 (32-bit)","pool_uuid":null,"pool_name":null,"id":"19a9eda5-1c16-1192-d200-a8d2996199eb"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 11 SP2 (64-bit)","pool_uuid":null,"pool_name":null,"id":"6ca6d910-536d-af6b-7121-0fa91092bfb6"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Debian Wheezy 7.0 (32-bit)","pool_uuid":null,"pool_name":null,"id":"60dec93f-bf95-dc51-fb5a-17f46b3b0e3b"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Oracle Enterprise Linux 5 (64-bit)","pool_uuid":null,"pool_name":null,"id":"189d51e2-4eec-210b-e8ac-feef15f081e0"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 4.5 (32-bit)","pool_uuid":null,"pool_name":null,"id":"65066ce0-ee12-1139-bd77-c98fbb678e4b"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Server 2003 (32-bit).","name":"Windows Server 2003 (32-bit)","pool_uuid":null,"pool_name":null,"id":"a7152eda-5b83-1df8-c866-b714f0ce594d"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 5 (64-bit)","pool_uuid":null,"pool_name":null,"id":"45471ab4-1914-b874-18da-029c0086c4b5"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 6 (64-bit)","pool_uuid":null,"pool_name":null,"id":"1e16d0a5-a286-eafc-f4f8-1d212cc1eefb"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 4.5 (32-bit)","pool_uuid":null,"pool_name":null,"id":"00b75c6f-31a0-58f3-26c6-478c2122f477"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Vista (32-bit).","name":"Windows Vista (32-bit)","pool_uuid":null,"pool_name":null,"id":"21ed0055-f9d3-0ab1-a8db-283195f7397c"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 11 (32-bit)","pool_uuid":null,"pool_name":null,"id":"8c58c4ba-886c-5bed-78cd-f4deef8e07e7"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 4.7 (32-bit)","pool_uuid":null,"pool_name":null,"id":"23c300f7-24e4-6765-15cf-cb35dd453beb"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 4.6 (32-bit)","pool_uuid":null,"pool_name":null,"id":"25f1b7fa-6fe2-3c74-11fd-51a9abc4c95e"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 4.8 (32-bit)","pool_uuid":null,"pool_name":null,"id":"edadfe1d-2168-6401-8a44-1e725f9f0339"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 5 (64-bit)","pool_uuid":null,"pool_name":null,"id":"4d5f990c-4943-19c9-0e84-78bbbbbdee42"},{"description":"Use this template to install a Xen API SDK using installation media","name":"Xen API SDK","pool_uuid":null,"pool_name":null,"id":"51de82c0-d3a4-ad6e-bf26-bbdfc9244c1f"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 11 SP2 (32-bit)","pool_uuid":null,"pool_name":null,"id":"6f8835e9-d26b-2748-2ba9-bd8622e208b2"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Server 2003 (64-bit).","name":"Windows Server 2003 (64-bit)","pool_uuid":null,"pool_name":null,"id":"f290c397-2599-647b-d3d6-39371e2bdf15"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Citrix XenApp on Windows Server 2008 (64-bit).","name":"Citrix XenApp on Windows Server 2008 (64-bit)","pool_uuid":null,"pool_name":null,"id":"5874ee5f-e9db-b352-092f-c73aeda426d1"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Server 2008 R2 (64-bit).","name":"Windows Server 2008 R2 (64-bit)","pool_uuid":null,"pool_name":null,"id":"62adbecb-b8b4-ec5e-ce8d-418e2a4bfd20"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP1 (32-bit)","pool_uuid":null,"pool_name":null,"id":"a7eed2bb-f77c-2aee-97d9-49164a07ab2f"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP3 (32-bit)","pool_uuid":null,"pool_name":null,"id":"e60fd3f9-f0b3-3930-1ff1-2701b970f052"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Ubuntu Precise Pangolin 12.04 (32-bit)","pool_uuid":null,"pool_name":null,"id":"74adc73b-f703-999a-0db5-2cb4b93c0c27"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Ubuntu Lucid Lynx 10.04 (32-bit)","pool_uuid":null,"pool_name":null,"id":"46a6b52e-022e-ffd2-9d3f-98cef7fd42cf"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 11 SP1 (32-bit)","pool_uuid":null,"pool_name":null,"id":"212661b4-f373-3372-fb59-4a1bf4bd084c"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP2 (32-bit)","pool_uuid":null,"pool_name":null,"id":"95fac83b-e59d-d526-3485-c388b78e3a2f"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Oracle Enterprise Linux 5 (32-bit)","pool_uuid":null,"pool_name":null,"id":"645ae725-f690-24fa-3f57-976b3367436b"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Debian Wheezy 7.0 (64-bit)","pool_uuid":null,"pool_name":null,"id":"b3c8b751-4ec4-14f3-d726-6a58db62d178"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Oracle Enterprise Linux 6 (32-bit)","pool_uuid":null,"pool_name":null,"id":"996f59d9-f7e3-a42f-6fd3-d35d6e64cf1c"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows 8 (32-bit).","name":"Windows 8 (32-bit)","pool_uuid":null,"pool_name":null,"id":"44d17a42-a1ae-2809-e573-d7a076c0c129"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 5 (32-bit)","pool_uuid":null,"pool_name":null,"id":"2c33c527-89e6-32cd-043b-53bef3f5304e"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows 7 (32-bit).","name":"Windows 7 (32-bit)","pool_uuid":null,"pool_name":null,"id":"a452f39f-3417-809a-1cbb-e639de467582"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 6 (32-bit)","pool_uuid":null,"pool_name":null,"id":"7bafe2ed-79c6-3a8d-c806-29232f718336"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 4.6 (32-bit)","pool_uuid":null,"pool_name":null,"id":"ef538bc7-aadd-4493-9f62-210b26845c7c"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows Server 2008 (32-bit).","name":"Windows Server 2008 (32-bit)","pool_uuid":null,"pool_name":null,"id":"9db9306e-3b97-b81d-e345-e6539ed5956a"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Citrix XenApp on Windows Server 2008 (32-bit).","name":"Citrix XenApp on Windows Server 2008 (32-bit)","pool_uuid":null,"pool_name":null,"id":"8bff789b-e252-7c3d-b182-4fb3ce0350c0"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Oracle Enterprise Linux 6 (64-bit)","pool_uuid":null,"pool_name":null,"id":"358d9b66-679c-40f4-b184-7574c2ff23fc"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Citrix XenApp on Windows Server 2008 R2 (64-bit).","name":"Citrix XenApp on Windows Server 2008 R2 (64-bit)","pool_uuid":null,"pool_name":null,"id":"4ca6ef09-eea0-0307-9abd-5232ccca1a9e"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"Red Hat Enterprise Linux 6 (32-bit)","pool_uuid":null,"pool_name":null,"id":"c66a113e-043b-15a8-668f-ecf21161a768"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 6 (64-bit)","pool_uuid":null,"pool_name":null,"id":"fbb07fcc-ae5d-8b1d-7ef9-c1a59c1892dd"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 11 (64-bit)","pool_uuid":null,"pool_name":null,"id":"6277217d-b992-de89-e3f4-da643debd167"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP3 (64-bit)","pool_uuid":null,"pool_name":null,"id":"424f2946-fa37-7830-c430-8753237034c6"},{"description":"Template which allows VM installation from install media","name":"Other install media","pool_uuid":null,"pool_name":null,"id":"bb025641-e81e-6de1-4c12-f6e43dae5808"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/\nIn order to install Debian Squeeze from CD\/DVD the multi-arch ISO image is required.","name":"Debian Squeeze 6.0 (64-bit)","pool_uuid":null,"pool_name":null,"id":"5cb21f43-62fe-2653-bcb2-3b646dfd43d3"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP4 (64-bit)","pool_uuid":null,"pool_name":null,"id":"0bc123d8-6372-b0ec-dc49-5dabbe80c4f8"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP1 (64-bit)","pool_uuid":null,"pool_name":null,"id":"125ec2f9-b8a0-6a7f-92a1-95bee7afd6f1"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Citrix XenApp on Windows Server 2003 (32-bit).","name":"Citrix XenApp on Windows Server 2003 (32-bit)","pool_uuid":null,"pool_name":null,"id":"277e29a7-7582-2058-904d-b070f1978b8d"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Ubuntu Maverick Meerkat 10.10 (64-bit) (experimental)","pool_uuid":null,"pool_name":null,"id":"3292e0d3-3abf-7162-e665-538094b3f089"},{"description":"Clones of this template will automatically provision their storage when first booted and then reconfigure themselves with the optimal settings for Windows XP SP3 (32-bit).","name":"Windows XP SP3 (32-bit)","pool_uuid":null,"pool_name":null,"id":"b744eee2-4bb8-9c82-86cf-3807d32bb9bc"},{"description":"Template that allows VM installation from Xen-aware EL-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"CentOS 5 (32-bit)","pool_uuid":null,"pool_name":null,"id":"82eead6e-c454-cf79-3904-103a9a28f0c2"},{"description":"Template that allows VM installation from Xen-aware Debian-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/","name":"Ubuntu Lucid Lynx 10.04 (64-bit)","pool_uuid":null,"pool_name":null,"id":"c320e7d1-dddd-7e32-ab38-d6c6995ad4a7"},{"description":"Template that allows VM installation from Xen-aware SLES-based distros. To use this template from the CLI, install your VM using vm-install, then set other-config-install-repository to the path to your network repository, e.g. http:\/\/\/ or nfs:server:\/","name":"SUSE Linux Enterprise Server 10 SP4 (32-bit)","pool_uuid":null,"pool_name":null,"id":"69e86aa5-b980-0472-3642-f9894da6e0d1"}]);

			app.main.show(new TemplatesListView({
				'collection': templates
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
		'main': '#reg-main',
	});

	app.addInitializer(function (options) {
		var app = this;

		app.xo = options.xo;

		//--------------------------------------

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

		//--------------------------------------

		// @todo Use Backbone.sync.
		_.each([
			'pool', 'host', 'vm',

			'network', 'sr', 'vdi',
		], function (klass) {
			app.xo.call('xapi.'+ klass +'.getAll', null, function (error, items) {
				app[klass +'s'].reset(items);
			});
		});
		app.xo.call('@todo Better sync', null, function (error, vms) {
			// @todo See comment below and find a better way.
			Backbone.history.start();
		});

		// @todo Wait for the requests above to finish initializing.

		//--------------------------------------

		/* jshint nonew:false */
		new Router();
	});

	app.on('initialize:after', function () {
		//Backbone.history.start();
	});

	//////////////////////////////////////////////////////////////////

	$(function () {
		app.start({
			'xo': new XO('ws://localhost:8080/api/'),
		});
	});
})(window._, window.jQuery, window.Backbone);
