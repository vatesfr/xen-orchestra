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
 * @author Julien Fontanet <julien.fontanet@vates.fr
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

!function(xo, _, undefined)
{
	'use strict';

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
	xo.formatSize = function(size, unit, base)
	{
		size = +size;
		unit = (undefined !== unit) ? ''+unit : 'B';
		base = (undefined !== base) ? base|0 : 1024;

		var powers = ['', 'K', 'M', 'G', 'T', 'P'];

		for (var i = 0; size > base; ++i)
		{
			size /= base;
		}

		// Maximum 1 decimals.
		size = ((size * 10)|0) / 10

		return (size + powers[i] + unit);
	};

	/**
	 * [description]
	 *
	 * @todo Find a better name!
	 * @todo Documentation
	 *
	 * @param {list} values [description]
	 * @param {number=} ratio  [description]
	 * @param {number=} total  [description]
	 *
	 * @return {[type]}        [description]
	 */
	xo.plop = function(values, ratio, total)
	{
		var sum = _.reduce(values, function(sum, value) {
			return (sum + +value);
		}, 0);

		var avg = sum / _.size(values);

		ratio = (undefined !== ratio) ? +ratio : 0.5;
		var comp = 1 - ratio; // Complementary ratio.

		var coef = (undefined !== total) ? +total / sum : 1;
		ratio *= coef;
		comp *= coef;
		_.each(values, function(value, i) {
			values[i] = ratio * values[i] + comp * avg;
		});

		return values;
	}

	/**
	 * @todo Documentation
	 *
	 * @param {integer} seconds Number of seconds of the duration.
	 * @param {string=} precision Last unit that should be used
	 *     (Default is “seconds”).
	 *
	 * @return {string}
	 */
	xo.formatDuration = function(seconds, precision)
	{
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

			if (precision === units[i][0])
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
	}

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
	xo.formatDuration.fromNow = function(timestamp, precision)
	{
		return xo.formatDuration(
			Math.floor(Date.now() / 1000 - timestamp),
			precision
		);
	}
}(window.xo = window.xo || {}, window._);
