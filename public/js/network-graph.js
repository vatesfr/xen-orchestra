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
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

/* exported network_graph */
/* global _, d3 */

function network_graph()
{
	'use strict';

	// Customizable settings.
	var cfg = {
		'width': 800,
		'height': 600,
	};

	// Node types.
	var TYPE_POOL = 0;
	var TYPE_HOST = 0;
	var TYPE_VM = 0;

	// Force layout settings.
	var alpha = 0.1;
	var charge = -30;
	var friction = 0.9;
	var gravity = 0;
	var iterations = 1e3;
	var link_length = function (link) { return link.length || 20; };
	var link_strength = 5;

	// Other graph settings.
	var distance_pool = 50;
	var distance_host = 100;
	var distance_vm = 125;
	var node_radius = 10;

	function create_picker(property)
	{
		return function (object) {
			return object[property];
		};
	}

	function create_nodes_and_links(pools)
	{
		var links = [];
		var hosts = [];
		var vms   = [];

		_.each(pools, function (pool) {
			pool.type = TYPE_POOL;
			pool.id || (pool.id = _.uniqueId());

			_.each(pool.hosts, function (host) {
				hosts.push(host);

				host.type = TYPE_HOST;
				host.id || (host.id = _.uniqueId());
				links.push({
					'id': pool.id +'-'+ host.id,
					'source': pool,
					'target': host,
					'length': distance_host,
				});
				host.pool = pool; // @todo UsefulNecessary?

				_.each(host.vms, function (vm) {
					vms.push(vm);

					vm.type = TYPE_VM;
					vm.id || (vm.id = _.uniqueId());
					links.push({
						'id': host.id +'-'+ vm.id,
						'source': host,
						'target': vm,
						'length': distance_vm,
					});
					vm.host = host; // @todo Necessary?
				});
			});
		});

		// Initially places pools, hosts and VMs on concentric
		// circles.

		var mid_w  = cfg.width / 2;
		var mid_h  = cfg.height / 2;
		var TWO_PI = 2 * Math.PI;

		var alpha = TWO_PI / pools.length;
		var radius = distance_pool;
		_.each(pools, function (pool, i) {
			var alpha_i = alpha * i;
			pool.x = Math.cos(alpha_i) * radius + mid_w;
			pool.y = Math.sin(alpha_i) * radius + mid_h;
			pool.fixed = true;
		});

		alpha = TWO_PI / hosts.length;
		radius += distance_host;
		_.each(hosts, function (host, i) {
			var alpha_i = alpha * i;
			host.x = Math.cos(alpha_i) * radius + mid_w;
			host.y = Math.sin(alpha_i) * radius + mid_h;
		});

		alpha = TWO_PI / vms.length;
		radius += distance_vm;
		_.each(vms, function (vm, i) {
			var alpha_i = alpha * i;
			vm.x = Math.cos(alpha_i) * radius + mid_w;
			vm.y = Math.sin(alpha_i) * radius + mid_h;
		});

		return [
			pools, hosts, vms,
			links,
		];
	}

	function polygon(edges, radius, alpha)
	{
		var angle = 2 * Math.PI / edges;
		if (undefined === alpha)
		{
			alpha = 0;
		}

		var coords = [];
		for (var i = 0; i < edges; ++i)
		{
			var angle_i = i * angle + alpha;

			coords.push(
				Math.cos(angle_i) * radius, // x
				Math.sin(angle_i) * radius  // y
			);
		}

		var path = 'M'+ coords.join(' ') +'Z';

		return function (selection) {
			return selection.append('path')
				.attr('class', 'symbol')
				.attr('d', path)
			;
		};
	}

	function transform(translate, scale)
	{
		var transform = [];

		if (translate)
		{
			transform.push('translate('+ translate.join(', ') +')');
		}
		if (scale)
		{
			transform.push('scale('+ scale +')');
		}

		return transform.join(' ');
	}

	function graph(g)
	{
		// Variables definition.
		var width = cfg.width;
		var height = cfg.height;
		var left = -width/2;
		var top = -height/2;

		var data = g.datum();

		//--------------------------------------

		// @todo Find a way to remove all existing elements in g.

		// Clipping element.
		g.append('defs').append('clipPath')
			.attr('id', 'clip-network-graph') // @todo Unique id.
			.append('rect')
				.attr('x', left)
				.attr('y', top)
				.attr('width', width)
				.attr('height', height)
		;

		//--------------------------------------

		// Root element for the graph.
		g = g.append('g')
			.attr('pointer-events', 'all')
			.attr('clip-path', 'url(#clip-network-graph)')
		;

		//--------------------------------------

		// Background element which allows us to get pointer events.
		g.append('rect')
			.attr('class', 'background')
			.attr('x', left)
			.attr('y', top)
			.attr('width', width)
			.attr('height', height)
		;

		//--------------------------------------

		// Group used by the network to apply dragging and zooming.
		var scene = g.append('g')
			.attr('transform', transform([left, top]))
		;

		//--------------------------------------

		var zoomer = d3.behavior.zoom().translate([left, top])
			.on('zoom', function () {
				var e = d3.event;

				scene.attr('transform', transform(e.translate, e.scale));
			})
		;

		g.call(zoomer)
			.on('dblclick', function () {
				zoomer.translate([left, top]).scale(1);

				scene.transition()
					.attr('transform', transform([left, top]))
				;
			})
			.on('dblclick.zoom', null)
		;

		//--------------------------------------

		// Force layout.
		var force = d3.layout.force()
			.alpha(alpha)
			.charge(charge)
			.friction(friction)
			.gravity(gravity)
			.linkDistance(link_length)
			.linkStrength(link_strength)
			.size([width, height])
		;

		////////////////////////////////////////
		// Update.
		////////////////////////////////////////

		// Creates pools, hosts and vms nodes and, links.
		var pools, hosts, vms, links;
		(function () {
			var tmp = create_nodes_and_links(data);

			pools = tmp[0];
			hosts = tmp[1];
			vms   = tmp[2];
			links = tmp[3];
		})();

		// Adds them to the force layout.
		force
			.links(links)
			.nodes(pools.concat(hosts, vms))
		;

		// Runs the force layout.
		force.start();
		for (var i = 0; i < iterations; ++i)
		{
			force.tick();
		}
		force.stop();

		//--------------------------------------

		var id_picker = create_picker('id');
		var label_picker = create_picker('label');

		//--------------------------------------

		var link = scene.selectAll('.link').data(links, id_picker);

		link.enter().append('line')
			.attr('class', 'link')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', 0)
		;

		link.transition()
			.attr('x1', function (d) { return d.source.x; })
			.attr('y1', function (d) { return d.source.y; })
			.attr('x2', function (d) { return d.target.x; })
			.attr('y2', function (d) { return d.target.y; })
		;

		link.exit().transition()
			.style('opacity', 0)
			.remove()
		;

		//--------------------------------------

		// @todo Manage all nodes together?

		//--------------------------------------

		var pool = scene.selectAll('.pool').data(pools, id_picker);

		pool.enter().append('a')
			.attr('class', 'node pool')
			.attr('xlink:href', function (d) {
				return '#pools/'+ d.id;
			})
			.call(function (selection) {
				selection.append('circle')
					.attr('class', 'symbol')
					.attr('r', node_radius)
				;
			})
			.append('text')
				.text(label_picker)
		;

		pool.transition()
			.attr('transform', function (d) {
				return transform([d.x, d.y]);
			})
		;

		pool.exit().transition()
			.style('opacity', 0)
			.remove()
		;

		//--------------------------------------

		var host = scene.selectAll('.host').data(hosts, id_picker);

		host.enter().append('a')
			.attr('class', 'node host')
			.attr('xlink:href', function (d) {
				return '#hosts/'+ d.id;
			})
			.call(polygon(4, node_radius))
			.append('text')
				.text(label_picker)
		;

		host.transition()
			.attr('transform', function (d) {
				return transform([d.x, d.y]);
			})
		;

		host.exit().transition()
			.style('opacity', 0)
			.remove()
		;

		//--------------------------------------

		var vm = scene.selectAll('.vm').data(vms, id_picker);

		vm.enter().append('a')
			.attr('class', 'node vm')
			.attr('xlink:href', function (d) {
				return '#vms/'+ d.id;
			})
			.call(polygon(3, node_radius))
			.append('text')
				.text(label_picker)
		;

		vm.transition()
			.attr('transform', function (d) {
				return transform([d.x, d.y]);
			})
		;
		vm.select('.symbol').transition()
			.attr('transform', function (d) {
				var x = d.host.x - d.x;
				var y = d.host.y - d.y;
				var angle = Math.acos(x / Math.sqrt(x*x + y*y)) / Math.PI * 180 + 180;

				return 'rotate('+ (y < 0 ? -angle : angle) +')';
			})
		;

		vm.exit().transition()
			.style('opacity', 0)
			.remove()
		;
	}

	// Add helper and setter for customizable settings.
	_.each(cfg, function (value, setting) {
		graph[setting] = function (setting) {
			return function (value) {
				// Getter.
				if (undefined === value)
				{
					return cfg[setting];
				}

				// Setter.
				cfg[setting] = value;
				return graph;
			};
		}(setting);
	});

	return graph;
 }
