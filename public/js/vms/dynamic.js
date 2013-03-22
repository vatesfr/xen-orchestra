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

!function ()
{
	"use strict";

	//--------------------------------------
	// Models & collections.
	//--------------------------------------

	var Vm = Backbone.Model.extend({});
	var Vms = Backbone.Collection.extend({
		'model': Vm,
	});

	function updateVms()
	{
		console.log(this.get('id'));
		var raw = this.get('vms');
		var col = this.previous('vms');
		col.update(raw);
		this.set('vms', col, {'silent': true});
	}
	var Host = Backbone.Model.extend({
		'initialize': function () {
			var vms = this.get('vms');
			if (vms instanceof Array)
			{
				this.set('vms', new Vms(vms), {'silent': true});
			}
			this.on('change:vms', updateVms, this);
		},
	});
	var Hosts = Backbone.Collection.extend({
		'model': Host,
	});

	//--------------------------------------
	// Views.
	//--------------------------------------

	var VmView = Backbone.Marionette.ItemView.extend({
		'template': '#tpl-vm',
		'tagName':  'tr',

		'modelEvents': {
			'change': 'render',
		},
	});

	var HostView = Backbone.Marionette.CompositeView.extend({
		'template':          '#tpl-host',

		'model':             Host,

		'itemView':          VmView,
		'itemViewContainer': 'tbody',

		'initialize':        function () {
			// Grab the collection of VMs from the host model.
			this.collection = this.model.get('vms');
		},
	});

	var HostsView = Backbone.Marionette.CollectionView.extend({
		'itemView': HostView,
	});

	//--------------------------------------
	// Application.
	//--------------------------------------

	var app = new Backbone.Marionette.Application();

	app.addRegions({
		'main': '#region-main',
	});

	app.addInitializer(function (hosts) {
		app.main.show(
			new HostsView({'collection': hosts})
		);
	});

	//--------------------------------------
	// Execution.
	//--------------------------------------

	$(function () {
		var hosts = new Hosts(window.hosts);
		app.start(hosts);

		function refresh()
		{
			$.ajax('?json').done(function (data, status, jqXHR) {
				hosts.update($.parseJSON(data));
			});

			window.setTimeout(refresh, 5000);
		}
		window.setTimeout(refresh, 5000);
	});
}();
