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

	var PIF = Backbone.Model.extend({});
	var PIFs = Backbone.Collection.extend({
		'model': PIF,
	});

	function updatePIFs()
	{
		console.log(this.get('id'));
		var raw = this.get('PIFs');
		var col = this.previous('PIFs');
		col.update(raw);
		this.set('PIFs', col, {'silent': true});
	}
	var Pool = Backbone.Model.extend({
		'initialize': function () {
			var PIFs_ = this.get('PIFs');
			if (PIFs_ instanceof Array)
			{
				this.set('PIFs', new PIFs(PIFs_), {'silent': true});
			}
			this.on('change:PIFs', updatePIFs, this);
		},
	});
	var Pools = Backbone.Collection.extend({
		'model': Pool,
	});

	//--------------------------------------
	// Views.
	//--------------------------------------

	var PIFView = Backbone.Marionette.ItemView.extend({
		'template': '#tpl-network',
		'tagName':  'tr',

		'modelEvents': {
			'change': 'render',
		},
	});

	var PoolView = Backbone.Marionette.CompositeView.extend({
		'template':          '#tpl-pool',

		'model':             Pool,

		'itemView':          PIFView,
		'itemViewContainer': 'tbody',

		'initialize':        function () {
			// Grab the collection of PIFs from the pool model.
			this.collection = this.model.get('PIFs');
		},
	});

	var PoolsView = Backbone.Marionette.CollectionView.extend({
		'itemView': PoolView,
	});

	//--------------------------------------
	// Application.
	//--------------------------------------

	var app = new Backbone.Marionette.Application();

	app.addRegions({
		'main': '#region-main',
	});

	app.addInitializer(function (pools) {
		app.main.show(
			new PoolsView({'collection': pools})
		);
	});

	//--------------------------------------
	// Execution.
	//--------------------------------------

	$(function () {
		var pools = new Pools(window.pools);
		app.start(pools);

		function refresh()
		{
			$.ajax('?json').done(function (data, status, jqXHR) {
				pools.update($.parseJSON(data));
			});

			window.setTimeout(refresh, 5000);
		}
		window.setTimeout(refresh, 5000);
	});
}();
