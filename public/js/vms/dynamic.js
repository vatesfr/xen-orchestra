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
	// Models.
	//--------------------------------------

	var Category = Backbone.Model.extend({});

	var Vm = Backbone.Model.extend({});

	//--------------------------------------
	// Collections.
	//--------------------------------------

	var Categories = Backbone.Collection.extend({
		'model': Category,
	});

	var Vms = Backbone.Collection.extend({
		'model': Vm,
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

		'events':   {
			'click td': function () {
				var model = this.model;
				if ('Running' === model.get('power_state'))
				{
					model.set('power_state', 'Stopped');
				}
				else
				{
					model.set('power_state', 'Running');
				}
			},
		},
	});

	var CategoryView = Backbone.Marionette.CompositeView.extend({
		'template':          '#tpl-category',

		'model':             Category,

		'itemView':          VmView,
		'itemViewContainer': 'tbody',

		'initialize':        function () {
			console.log(this.model);
			// Grab the collection of VMs from the category model.
			this.collection = this.model.get('vms');
		},
	});

	var CategoriesView = Backbone.Marionette.CollectionView.extend({
		'itemView': CategoryView,
	});

	//--------------------------------------
	// Application.
	//--------------------------------------

	var app = new Backbone.Marionette.Application();

	app.addRegions({
		'main': '#region-main',
	});

	app.addInitializer(function (categories) {
		app.main.show(
			new CategoriesView({'collection': categories})
		);
	});

	//--------------------------------------
	// Execution.
	//--------------------------------------

	$(function () {
		app.start(new Categories([
			{
				'name': 'Normal',
				'vms':  new Vms(window.vms),
			},
			{
				'name': 'Template',
				'vms':  new Vms(window.vms),
			},
		]));
	});
}();
