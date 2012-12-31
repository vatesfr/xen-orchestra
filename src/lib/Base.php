<?php
/**
 * This file is a part of IoViz.
 *
 * IoViz is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * IoViz is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with IoViz. If not, see <http://www.gnu.org/licenses/>.
 *
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/gpl-3.0-standalone.html GPLv3
 *
 * @package IoViz
 */

/**
 * Ultimate base class.
 */
abstract class Base
{
	function __destruct()
	{}

	function __get($name)
	{
		trigger_error(
			'no such readable property '.get_class($this).'->'.$name,
			E_USER_ERROR
		);
	}

	function __set($name, $value)
	{
		trigger_error(
			'no such writable property '.get_class($this).'->'.$name,
			E_USER_ERROR
		);
	}

	protected function __construct()
	{}
}
