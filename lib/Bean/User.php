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
 *
 */
final class User extends \Rekodi\Bean
{
	/**
	 *
	 */
	const NONE = 0;

	/**
	 *
	 */
	const READ = 1;

	/**
	 *
	 */
	const WRITE = 2;

	/**
	 *
	 */
	const ADMIN = 3;

	/**
	 *
	 */
	static function permissionFromString($string)
	{
		$permissions = array(
			'none'  => self::NONE,
			'read'  => self::READ,
			'write' => self::WRITE,
			'admin' => self::ADMIN
		);

		return isset($permissions[$string])
			? $permissions[$string]
			: false;
	}

	/**
	 *
	 */
	static function permissionToString($permission)
	{
		$permissions = array(
			self::NONE  => 'none',
			self::READ  => 'read',
			self::WRITE => 'write',
			self::ADMIN => 'admin',
		);

		return isset($permissions[$permission])
			? $permissions[$permission]
			: false;
	}

	/**
	 * This function is not necessary but allow us to dynamically
	 * initialize our bean.
	 */
	static function init()
	{
		self::$_fields = array_flip(array(
			'id',
			'name',
			'password',
			'permission',
		));
	}

	/**
	 *
	 */
	static function check($field, &$value)
	{
		switch ($field)
		{
			case 'id':
				return true;
			case 'name':
				return (
					is_string($value)
					&& preg_match('/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/', $value)
				);
			case 'password':
				return (
					is_string($value)
					&& preg_match('/^.{8,}$/', $value)
				);
			case 'permission':
				$value = self::permissionFromString($value);
				return (false !== $value);
		}

		return false;
	}

	protected static $_fields;
}
User::init();
