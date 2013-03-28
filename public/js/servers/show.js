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

	var Host = Backbone.Model.extend({});

	//--------------------------------------
	// Views.
	//--------------------------------------

	var HostView = Backbone.Marionette.ItemView.extend({
		'template':   '#tpl-host',
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

	app.addInitializer(function (host) {
		app.main.show(
			new HostView({'model': host})
		);
	});

	//--------------------------------------
	// Execution.
	//--------------------------------------

	$(function () {
		var host = new Host(window.host);
		app.start(host);

	    //$('#tab-host a:[href="#general"]').tab('show');

		function refresh()
		{
			$.ajax('?json').done(function (data, status, jqXHR) {
				host.set($.parseJSON(data));
			});

			window.setTimeout(refresh, 5000);
		}
		window.setTimeout(refresh, 5000);
	});
}();
