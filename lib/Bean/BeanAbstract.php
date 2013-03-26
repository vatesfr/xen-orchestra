<?php
/**
 * This file is a part of Xen Orchestra Server.
 *
 * Xen Orchestra Server is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * Xen Orchestra Server is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Xen Orchestra Server. If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/gpl-3.0-standalone.html GPLv3
 *
 * @package Xen Orchestra Server
 */

namespace Bean;

/**
 * @todo Migrate check() and checkAndSet() to \Rekodi\Bean.
 */
abstract class BeanAbstract extends \Rekodi\Bean
{
	/**
	 * This function is not necessary but allow us to dynamically
	 * initialize our beans.
	 */
	static final function init($fields)
	{
		foreach ($fields as $key => $value)
		{
			if (is_bool($value))
			{
				static::$_fields[$key] = $value;
			}
			else
			{
				static::$_fields[$value] = false;
			}
		}
	}

	/**
	 *
	 */
	static function check($field, &$value)
	{
		return isset(static::$_fields[$field]);
	}

	/**
	 *
	 */
	function __get($name)
	{
		$value = parent::__get($name);
		if (static::$_fields[$name])
		{
			return json_decode($value, true);
		}
		return $value;
	}

	/**
	 *
	 */
	function __set($name, $value)
	{
		if (is_array($value)
			|| is_object($value))
		{
			$value = json_encode($value);
		}

		return parent::__set($name, $value);
	}

	/**
	 *
	 */
	final function checkAndSet($field, $value)
	{
		if (!static::check($field, $value))
		{
			return false;
		}

		$this->__set($field, $value);
		return true;
	}
}
