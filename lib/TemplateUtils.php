<?php
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

/**
 *
 */
final class TemplateUtils
{
	function __construct(ServiceLocator $sl)
	{
		$this->_sl = $sl;
	}

	/**
	 * @var ServiceLocator
	 */
	private $_sl;

	//--------------------------------------

	function generateSelectOptions(
		Gallic_Template $tpl,
		array $parameters
	)
	{
		$options  = $parameters['options'];
		$selected = isset($parameters['selected'])
			? $parameters['selected']
			: null;

		$html = '';
		foreach ($options as $name => $value)
		{
			$html .=
				"<option value=\"$value\"".
				($value === $selected ? ' selected="selected"' : '').
				">$name</option>";
		}
		return $html;
	}

	function url(Gallic_Template $tpl, array $parameters)
	{
		isset($parameters['controller'])
			or $parameters['controller'] = $this->_sl->get('current_controller');

		return $this->_sl->get('routes')->build('default', $parameters);
	}
}
