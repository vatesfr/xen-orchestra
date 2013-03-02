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

	$('.navbar a:first-child').tooltip({placement:'bottom'});

	$('a[data-confirm]').click(function(e) {
		if (!window.confirm($(this).attr('data-confirm')))
		{
			e.preventDefault();
		}
	});

	$('form .enable-on-change[type="submit"]').each(function () {
		var submit = $(this).data('changed-items', 0);
		var handle = function (obj, changed) {
			obj = $(obj);
			if (!!obj.data('previous-state') === changed)
			{
				return;
			}
			obj.data('previous-state', changed);

			var counter = submit.data('changed-items') + (changed ? 1 : -1);
			submit.data('changed-items', counter);
			if (counter)
			{
				submit.removeAttr('disabled');
			}
			else
			{
				submit.attr('disabled', 'disabled');
			}
		};

		$(':text', submit.form).change(function () {
			handle(this, this.value !== this.defaultValue);
		});
		$('select', submit.form).change(function () {
			handle(this, !this.options[this.selectedIndex].defaultSelected);
		});
		$(':checkbox', submit.form).change(function () {
			handle(this, this.checked !== this.defaultChecked);
		});
	});

	/**
	 * Blink Bell
	 *
	 * TODO: blink only when notifications.
	 */
	function blink(selector)
	{
		$(selector).fadeOut('slow', function () {
			$(this).fadeIn('slow', function () {
				blink(this);
			});
		});
	}
	//blink('#msg');
}();
