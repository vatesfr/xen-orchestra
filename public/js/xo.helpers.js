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
		unit = (undefined !== unit) ? ''+unit : 'B';
		base = (undefined !== base) ? base|0 : 1024;

		var powers = ['', 'K', 'M', 'G', 'T', 'P'];
		var str = '' + size;

		for (var i = 0; size > base; ++i)
		{
			size = (size|0) / base;
		}

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
}(window.xo = window.xo || {}, window._);
