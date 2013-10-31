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

//////////////////////////////////////////////////////////////////////
// Main application.
//////////////////////////////////////////////////////////////////////
define([
	'q',
	'underscore',
	'bootstrap', // jQuery with Bootstrap plugins.
	'backbone',
	'marionette',
	'template_helpers',
	'd3',
	'network_graph',
	'rfb',
	'bootstrap_wizard',
	'select2',
], function (
	Q,
	_,
	$,
	Backbone,
	Marionette,
	template_helpers,
	d3,
	network_graph,
	RFB
) {
	'use strict';

	var app = new Marionette.Application();

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
	// Models.
	//////////////////////////////////////////////////////////////////

	var User = Backbone.Model.extend({});
	var Server = Backbone.Model.extend({});

	//////////////////////////////////////////////////////////////////
	// Collections.
	//////////////////////////////////////////////////////////////////

	var Users = Backbone.Collection.extend({
		'model': User,
		'comparator': function (user) {
			return user.get('email').toLowerCase();
		},
	});

	var Servers = Backbone.Collection.extend({
		'model': Server,
		'comparator': function (server) {
			return server.get('host').toLowerCase();
		},
	});

	//////////////////////////////////////////////////////////////////
	// Views.
	//////////////////////////////////////////////////////////////////

	var _serializeData = function () {
		function escape(object, depth)
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
					object[property] = _.escape(value, depth);
				}
				else if (_.isObject(value)
					&& !(value instanceof Backbone.Collection)
					&& !(value instanceof Backbone.Model))
				{
					object[property] = value = _.clone(value);
					escape(value, depth);
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
					'items-template': 'itemViewTemplate',
				}, function (entry, attr) {
					var value;
					if (!options[entry]
						&& (value = $tpl.attr('data-'+ attr)))
					{
						options[entry] = value;
					}
				});
			}

			if (options.itemViewTemplate && !options.itemView)
			{
				options.itemView = ItemView.extend({
					'template': options.itemViewTemplate,
				});
				delete options.itemViewTemplate;
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

	// @todo Ugly dependency.
	template_helpers.app = app;

	var ItemView = Marionette.ItemView.extend({
		'templateHelpers': template_helpers,

		'constructor': _constructor(Marionette.ItemView),

		'serializeData': _serializeData,
	});

	var CompositeView = Marionette.CompositeView.extend({
		'templateHelpers': template_helpers,

		'constructor': _constructor(Marionette.CompositeView),

		'serializeData': _serializeData,
	});

	// var LayoutView = Marionette.Layout.extend({
	// 	'template_helpers': template_helpers,

	// 	'constructor': _constructor(Marionette.Layout),

	// 	'serializeData': _serializeData,
	// });

	var CollectionView = Marionette.CollectionView.extend({});

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
					//var promises = [];

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

			// @todo Not pretty but effective.
			'click .dropdown-toggle': function () {
				var input = this.$(':input:first')[0];
				setTimeout(function () { input.focus(); }, 100);
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

	var AdminUsersView = CompositeView.extend({
		'template': '#tpl-admin-users',

		'events': {
			'submit .js-update-users': function (e) {
				e.preventDefault();
				var $form = $(e.target);

				var DELETE = /^delete\[(.+)\]$/;
				var UPDATE = /^(permission)\[(.+)\]$/;
				var to_delete = {};
				var to_update = {};
				_.each($form.serializeArray(), function (field) {
					var match, id;
					if ( (match = field.name.match(DELETE)) )
					{
						id = match[1];
						to_delete[id] = true;
						delete to_update[id];
					}
					else if ( (match = field.name.match(UPDATE)) )
					{
						id = match[2];
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

	var AdminServersView = CompositeView.extend({
		'template': '#tpl-admin-servers',

		'initialize': function () {
			var collection = this.collection = new Servers();
			app.xo.call('server.getAll').then(function (servers) {
				collection.set(servers);
			}).fail(function (e) {
				app.alert({'message': e.message});
			});
		},

		'events': {
			'submit .js-update-servers': function (e) {
				e.preventDefault();
				var $form = $(e.target);

				var promises = [];
				_.each($form.serializeArray(), function (input) {
					promises.push(app.xo.call('server.remove', {'id': input.name}));
				});

				var collection = this.collection;
				Q.all(promises).then(function () {
					return app.xo.call('server.getAll').then(function (servers) {
						collection.set(servers);
					});
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
					'label': 'Pool 1',
					'hosts': [
						{
							'label': 'Host 1',
							'vms': [
								{ 'label': 'VM 1' },
								{ 'label': 'VM 2' },
								{ 'label': 'VM 3' },
								{ 'label': 'VM 4' },

							]
						},
					]
				},
				{
					'label': 'Pool 2',
					'hosts': [
						{
							'label': 'Host 1',
							'vms': [
								{ 'label': 'VM 1' },
								{ 'label': 'VM 2' },
							]
						}
					]
				},
				{
					'label': 'Pool 3',
					'hosts': [
						{
							'label': 'Host 1',
							'vms': [
								{ 'label': 'VM 1' },
								{ 'label': 'VM 2' },
								{ 'label': 'VM 3' },
								{ 'label': 'VM 4' },
								{ 'label': 'VM 5' },
							]
						},
					]
				},
				{
					'label': 'Pool 4',
					'hosts': [
						{
							'label': 'Host 1',
							'vms': [
								{ 'label': 'VM 1' },
								{ 'label': 'VM 2' },
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

	var HostsListView = CompositeView.extend({
		'template': '#tpl-hosts-list',

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

	var VMsListView = CompositeView.extend({
		'template': '#tpl-vms-list',

		'events': {
			'click .js-pause': function(e) {
				e.preventDefault();
				var vm_id = $(e.currentTarget).attr('data-id');
				app.xo.call('xapi.vm.pause', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-unpause': function(e) {
				e.preventDefault();
				var vm_id = $(e.currentTarget).attr('data-id');
				app.xo.call('xapi.vm.unpause', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-clean-reboot': function(e) {
				e.preventDefault();
				var vm_id = $(e.currentTarget).attr('data-id');
				app.xo.call('xapi.vm.reboot', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-start': function(e) {
				e.preventDefault();
				var vm_id = $(e.currentTarget).attr('data-id');
				app.xo.call('xapi.vm.start', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
			'click .js-clean-shutdown': function(e) {
				e.preventDefault();
				var vm_id = $(e.currentTarget).attr('data-id');
				app.xo.call('xapi.vm.shutdown', {'id':vm_id}).fail(function (e) {
					app.alert({'message': e.message});
				});
			},
		},
		'initialize': function () {
			this.collection = this.model.get('VMs');
		},
	});

	//----------------------------------------------------------------

	// @todo Do not load this view before necessary.
	var VMConsoleView = ItemView.extend({
		'template': '#tpl-vm-console',

		'initialize': function () {
			var view = this;
			var VM = this.model;

			if ('Running' !== VM.get('power_state'))
			{
				return;
			}

			var consoles = _.map(VM.get('consoles'), function (ref) {
				return app.xobjs[ref];
			});
			var vm_console = _.findWhere(consoles, {
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
			url.query += '&session_id='+ VM.get('session');

			view.on('dom:refresh', function () {
				view.rfb = new RFB({
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
			if (this.rfb)
			{
				this.rfb.disconnect();
			}
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

	var NetworksListView = CompositeView.extend({
		'template': '#tpl-networks-list',

		'initialize': function () {
			this.collection = this.model.get('PIFs');
		},
	});

	//----------------------------------------------------------------

	var SRsListView = CompositeView.extend({
		'template': '#tpl-storages-list',

		'initialize': function () {
			this.collection = this.model.get('SRs');
		},
	});

	//----------------------------------------------------------------

	var TemplatesListView = CompositeView.extend({
		'template': '#tpl-templates-list',

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
			'admin/servers': 'admin_servers',

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

		'admin_servers': function () {
			app.main.show(new AdminServersView());
		},

		'hosts_listing': function () {
			app.main.show(new CollectionView({
				'collection': app.getPools(),
				'itemView': HostsListView,
			}));
		},

		'host_show': function (uuid) {
			var host = app.getHost(uuid);
			if (!host)
			{
				return this.error_page('No such host: '+ uuid);
			}

			app.main.show(new HostView({'model': host}));
		},

		'vms_listing': function () {
			app.main.show(new CollectionView({
				'collection': app.getHosts(),
				'itemView': VMsListView,
			}));
		},

		'vm_show': function (uuid) {
			var vm = app.getVM(uuid);
			if (!vm)
			{
				return this.error_page('No such vm: '+ uuid);
			}

			app.main.show(new VMView({'model': vm}));
		},

		'vm_new': function () {
			app.main.show(new VMNewView());
		},

		'storages_listing': function () {
			app.main.show(new CollectionView({
				'collection': app.getPools(),
				'itemView': SRsListView,
			}));
		},

		'networks_listing': function () {
			app.main.show(new CollectionView({
				'collection': app.getPools(),
				'itemView': NetworksListView,
			}));
		},

		'templates_listing': function () {
			app.main.show(new CollectionView({
				'collection': app.getPools(),
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

	// app has already been declared due to an ugly dependency.

	app.addRegions({
		'alerts': '#reg-alerts',
		'main': '#reg-main',
		'session': '#reg-session',
	});

	//----------------------------------------------------------------

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
			console.trace();
		};

		// @todo Implements session persistence using token and local
		// storage.
		app.user = new Backbone.Model({});

		app.stats = new Backbone.Model({
			'hosts': 'N/A',
			'vms': 'N/A',
			'running_vms': 'N/A',
			'used_memory': 'N/A',
			'total_memory': 'N/A',
			'vcpus': 'N/A',
			'cpus': 'N/A',
			'vifs': 'N/A',
			'srs': 'N/A',
		});

		//--------------------------------------

		app.xobjs = {};
		app.collections = {};

		var refresh = function () {
			var xo = app.xo;
			var xobjs = app.xobjs = {};
			var collections = app.collections;

			return Q.all(_.map(app.collections, function (collection, klass) {
				var method = 'xapi.'+ klass +'.getAll';

				return xo.call(method).then(function (items) {
					_.each(items, function (item) {
						xobjs[item.id] = item;
					});

					if ('host' === klass)
					{
						items.push({
							'id': 'no-host',
							'name_label': 'No host',
						});
					}

					collections[klass].set(items);
				});
			}));
		};

		// @todo Use Backbone.sync.

		app.getVM = function (uuid) {
			return app.getVMs().findWhere({'uuid': uuid});
		};
		app.getVMs = function () {
			var vms;
			return function () {
				if (!vms)
				{
					vms = app.collections.VM.subset(function (vm) {
						return (
							(vm.get('is_control_domain') === false)
							&& (vm.get('is_a_template') === false)
						);
					});
				}

				return vms;
			};
		}();

		app.getHost = function (uuid) {
			return app.collections.host.findWhere({'uuid': uuid});
		};
		app.getHosts = function () {
			return app.collections.host;
		};

		app.gePool = function (uuid) {
			return app.collections.pool.findWhere({'uuid': uuid});
		};
		app.getPools = function () {
			return app.collections.pool;
		};

		app.xo.call('xapi.getClasses').then(function (classes) {
			var collections = app.collections;
			var Collection = Backbone.Collection.extend({
				'comparator': function (model) {
					// If no UUID, push the model at the end.
					if (!model.get('uuid'))
					{
						return '~';
					}

					var name_label = model.get('name_label');
					return (name_label ? name_label.toLowerCase() : model.id);
				},
			});

			_.each(classes, function (klass) {
				collections[klass] = new Collection();
			});

			function link_hosts(host)
			{
				// Special case for non-running VMs.
				if (!host.get('uuid'))
				{
					host.set('VMs', app.getVMs().subset(function (VM) {
						return ('OpaqueRef:NULL' === VM.get('resident_on'));
					}));
					return;
				}

				var id = host.get('id');
				var VMs = app.getVMs().subset(function (VM) {
					return (VM.get('resident_on') === id);
				});

				host.set('VMs', VMs);
			}
			collections.host.on('add', link_hosts);
			collections.host.on('change', link_hosts);

			function link_pools(pool)
			{
				var id = pool.get('pool');

				var hosts = app.getHosts().subset(function (host) {
					return (host.get('pool') === id);
				});
				pool.set('hosts', hosts);

				var templates = app.collections.VM.subset(function (VM) {
					// @todo Correctly handle snapshots.
					return (
						VM.get('is_a_template')
						&& (VM.get('pool') === id)
					);
				});
				pool.set('templates', templates);

				var SRs = app.collections.SR.subset(function (SR) {
					return (SR.get('pool') === id);
				});
				pool.set('SRs', SRs);

				// @todo
				var PIFs = app.collections.PIF.subset(function (PIF) {
					return (PIF.get('pool') === id);
				});
				pool.set('PIFs', PIFs);
			}
			collections.pool.on('add', link_pools);
			collections.pool.on('change', link_pools);

			return refresh();
		}).then(function () {
			Backbone.history.start();

			// @todo Implement events.
			window.setInterval(refresh, 5000);
		}).fail(function (e) {
			console.log(e.stack);
		});

		//--------------------------------------
		// Binds actions to global objects.

		var $modal_new_server = $('#modal-new-server');
		var $modal_new_server_form = $modal_new_server.find('form');
		$modal_new_server_form.submit(function (e) {
			e.preventDefault();

			var $this = $modal_new_server_form;
			var values = {};
			_.each($this.serializeArray(), function (entry) {
				values[entry.name] = entry.value;
			});
			app.xo.call('server.add', values).fail(function (e) {
				app.alert({'message': e.message});
			});

			$modal_new_server.modal('hide');
		});
		$modal_new_server.on('shown', function () {
			$modal_new_server.find(':input:first')[0].focus();
		});
		$modal_new_server.on('hidden', function () {
			$modal_new_server_form[0].reset();
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

	return app;
});
