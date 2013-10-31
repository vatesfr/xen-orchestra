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
// Template helpers.
//////////////////////////////////////////////////////////////////////
define([
	'underscore',
	'backbone',
	'moment',
], function (_, Backbone, moment) {
	'use strict';

	return {
		/**
		 * Moment.js
		 */
		'moment': moment,

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
					parts.push(m +' '+ units[i][0]);
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
		'get': function (/* scope, */ path, def) {
			var current = this;

			if (!_.isArray(path))
			{
				if (_.isObject(path))
				{
					current = path;
					path = def;
					def = arguments[2];
				}

				if (_.isString(path))
				{
					path = path.split('.');
				}
			}

			for (var i = 0, n = path.length; i < n; ++i)
			{
				var part = path[i];

				if (current instanceof Backbone.Model)
				{
					current = current.get(current);
				}
				else
				{
					current = current[part];
				}

				if (_.isString(current))
				{
					if ('OpaqueRef:NULL' === current)
					{
						current = null;
					}
					else if (0 === current.indexOf('OpaqueRef:'))
					{
						var tmp = this.app.xobjs[current];
						if (tmp)
						{
							current = tmp;
						}
					}
				}

				if (!current)
				{
					break;
				}
			}

			if ((i < n) || (undefined === current))
			{
				return def;
			}

			if (_.isString(current))
			{
				return _.escape(current);
			}

			return current;
		},

		/**
		 *
		 */
		'getMessages': function () {
			var uuid = this.uuid;
			return this.app.collections.message.subset(function (message) {
				return (uuid === message.get('obj_uuid'));
			});
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
				'<a href="#', path, '">',
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

				if ((bar.value = Math.round(bar.value)) <= 0)
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
				'<span class="label label-', state_to_colors[state], '">',
				state,
				'</span>',
			].join('');
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} actionButtons [description]
		 *
		 * @return string
		 */
		'actionButtons': function () {
			switch (this.power_state)
			{
			case 'Running':
				return [
					'<button class="btn btn-small js-pause" data-id="',
					this.id, '" title="Pause">',
					'<i class="fa fa-pause"></i></button> ',
					'<button class="btn btn-small js-clean-reboot" data-id="',
					this.id, '" title="Restart">',
					'<i class="fa fa-refresh"></i></button> ',
					'<button class="btn btn-small js-clean-shutdown" data-id="',
					this.id, '" title="Stop">',
					'<i class="fa fa-stop"></i></button>',
				].join('');
			case 'Paused':
				return '<button class="btn btn-small js-unpause" data-id="'+ this.id +'" title="Unpause"><i class="fa fa-play"></i></button>';
			case 'Halted':
				return '<button class="btn btn-small js-start" data-id="'+ this.id +'" title="Start"><i class="fa fa-play"></i></button>';
			}
		},

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} actionButtons [description]
		 *
		 * @return string
		 */
		'statusIcon': function () {
			switch (this.power_state)
			{
			case 'Running':
				return '<i class="fa fa-circle-o" title="Status: running" style="color:green"></i>';
			case 'Paused':
				return '<i class="fa fa-circle-o" title="Status: paused" style="color:#005599"></i>';
			case 'Halted':
				return '<i class="fa fa-circle-o" title="Status: halted" style="color:#d60000"></i>';
			default:
				return '<i class="fa fa-circle-o" title="Status: unknown" style="color:black"></i>';
			}
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
			if (this.currently_attached) {
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

		/**
		 * [description]
		 *
		 * @todo Documentation
		 *
		 * @param {string} selected Selected permission if any.
		 *
		 * @return string
		 */
		'permissionsList': function (selected) {
			var perms = {
				'none': 'None',
				'read': 'Read',
				'write': 'Write',
				'admin': 'Administration',
			};

			if (!selected)
			{
				selected = this.permission;
			}

			var html = [];
			for (var perm in perms)
			{
				html.push('<option value="', perm, '"');
				if (selected === perm)
				{
					html.push(' selected="selected"');
				}
				html.push('>', perms[perm], '</option>');
			}
			return html.join('');
		},
	};
});
