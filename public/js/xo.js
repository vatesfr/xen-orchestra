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
		 * @param {integer} percentage [description]
		 * @param {object=} options [description]
		 *
		 * @return string
		 */
		'progressBar': function (percentage, options) {
			percentage = Math.round(percentage);
			if (percentage < 0)
			{
				percentage += 100;
			}

			var label = (options && options.label) || (percentage +'%');

			return [
				'<div class="progress progress-info progress-small" ',
				'title="'+ label +'">',
				'<div class="bar" style="width:'+ percentage +'%"></div>',
				'</div>',
			].join('');
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

	var ItemView = Backbone.Marionette.ItemView.extend({
		'templateHelpers': template_helpers,

		'constructor': function () {
			Backbone.Marionette.ItemView.apply(this, arguments);

			if (this.model)
			{
				this.listenTo(this.model, 'change', this.render);
			}
		},

		'serializeData': _serializeData,
	});

	var CompositeView = Backbone.Marionette.CompositeView.extend({
		'templateHelpers': template_helpers,

		'constructor': function () {
			Backbone.Marionette.CompositeView.apply(this, arguments);

			if (this.model)
			{
				this.listenTo(this.model, 'change', this.render);
			}
		},

		'serializeData': _serializeData,
	});

	var CollectionView = Backbone.Marionette.CollectionView.extend({});

	//////////////////////////////////////////////////////////////////

	var StatsView = ItemView.extend({
		'template': '#tpl-stats',
	});

	var HostsListItemView = ItemView.extend({
		'template': '#tpl-hosts-list-item',
		'tagName': 'tr',
	});
	var HostsListView = CompositeView.extend({
		'template': '#tpl-hosts-list',
		'className': 'container',

		'itemView': HostsListItemView,
		'itemViewContainer': 'tbody',

		'initialize': function () {
			this.collection = this.model.get('hosts');
		},
	});
	var PoolView = CollectionView.extend({
		'itemView': HostsListView,
	});

	// var VMsListItemView = ItemView.extend({
	// 	'template': '#tpl-vms-list-item',
	// 	'tagName': 'tr',
	// });
	// var VMsListView = CompositeView.extend({
	// 	'template': '#tpl-vms-list',

	// 	'itemView': VMsListItemView,
	// 	'itemViewContainer': 'tbody',
	// });

	//////////////////////////////////////////////////////////////////
	// Router.
	//////////////////////////////////////////////////////////////////

	// @todo Puts this model in a controller.
	var stats;

	var Router = Backbone.Router.extend({
		'routes': {
			'': 'home',

			'hosts': 'hosts_listing',
			// 'hosts/:id': 'host_show',
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

			// 'vms': 'vms_listing',
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
