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

	//--------------------------------------
	// Views.
	//--------------------------------------

	var VmView = Backbone.Marionette.ItemView.extend({
		'template':  '#tpl-vm',
		'className':  'row well',

		'modelEvents': {
			'change': 'render',
		},
	});

	//--------------------------------------
	// Application.
	//--------------------------------------

	var app = new Backbone.Marionette.Application();

	app.addRegions({
		'main': '#region-main',
	});

	app.addInitializer(function (vm) {
		app.main.show(
			new VmView({'model': vm})
		);
	});

	//--------------------------------------
	// Execution.
	//--------------------------------------

	$(function () {
		var vm = new Vm(window.vm);
		app.start(vm);

	    //$('#tab-vm a:[href="#general"]').tab('show');

		function refresh()
		{
			$.ajax('?json').done(function (data, status, jqXHR) {
				vm.set($.parseJSON(data));
			});

			window.setTimeout(refresh, 5000);
		}
		window.setTimeout(refresh, 5000);
	});
}();
