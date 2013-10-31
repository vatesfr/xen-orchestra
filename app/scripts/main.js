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

// Require.js configuration. (http://requirejs.org/)
require.config({

	// http://requirejs.org/docs/api.html#config-paths
	paths: {
		/* jshint maxlen: false */

		text: '../bower_components/requirejs-text/text',

		// The version we are using currently does not embbed a
		// compiled version of the JavaScript.
		// @todo Fix when switching to Bootstrap 3.
		bootstrap: 'bootstrap',

		backbone: '../bower_components/backbone/backbone',
		bootstrap_wizard: '../bower_components/twitter-bootstrap-wizard/jquery.bootstrap.wizard',
		d3: '../bower_components/d3/d3',
		jquery: '../bower_components/jquery/jquery',
		marionette: '../bower_components/marionette/lib/backbone.marionette',
		moment: '../bower_components/momentjs/moment',
		q: '../bower_components/q/q',
		select2: '../bower_components/select2/select2',
		underscore: '../bower_components/underscore/underscore',

		// noVNC (cat base64.js, display.js, input.js, jsunzip.js, rfb.js util.js websock.js).
		rfb: 'rfb',
	},

	// http://requirejs.org/docs/api.html#config-shim
	shim: {
		backbone: {
			deps: ['jquery', 'underscore'],
			exports: 'Backbone',
		},

		bootstrap: {
			deps: ['jquery'],
			exports: 'jQuery',
		},

		bootstrap_wizard: {
			deps: ['jquery'],
			exports: 'jQuery',
		},

		d3: {
			exports: 'd3',
		},

		marionette: {
			deps: ['backbone'],
			exports: 'Marionette',
		},

		select2: {
			deps: ['jquery'],
			exports: 'Seelect2',
		},

		underscore: {
			exports: '_',
		},

		rfb: {
			exports: 'RFB',
		}
	}
});

require([
	'app',
	'xo',
], function (app, XO) {
	'use strict';

	var loc = window.location;

	var protocol = ('https:' === loc.protocol) ? 'wss' : 'ws';
	var host = loc.host;
	var path = loc.pathname;

	app.start({
		'xo': new XO(protocol +'://'+ host + path +'api/'),
	});
});
