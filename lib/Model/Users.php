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

namespace Model;

/**
 *
 */
final class Users
{
	/**
	 *
	 */
	function __construct(\Rekodi\Manager $manager)
	{
		$this->_manager = $manager;
	}

	/**
	 *
	 */
	function delete($id)
	{
		$n = $this->_manager->delete(array('id' => $id));

		if ($n !== 1)
		{
			trigger_error(
				'unexpected number of deleted users ('.$n.')',
				E_USER_ERROR
			);
		}
	}

	/**
	 * @param string $id
	 * @param mixed  $default
	 *
	 * @return User
	 */
	function get($id, $default = 'fatal error')
	{
		$users = $this->_manager->get(array('id' => $id));

		if ($users)
		{
			return $users[0];
		}

		if (func_num_args() >= 2)
		{
			return $default;
		}

		trigger_error(
			'no such user (id = '.$id.')',
			E_USER_ERROR
		);
	}

	/**
	 *
	 */
	function save(User $user)
	{
		if (!isset($user->id))
		{

			// @todo Fills the user with its generated id.

			return;
		}

		$n = $this->_manager->update(
			$user->getOriginals(),
			$user->getDirty()
		);

		if ($n !== 1)
		{
			trigger_error(
				'unexpected number of updated users ('.$n.')',
				E_USER_ERROR
			);
		}
	}

	/**
	 * @var \Rekodi\Manager
	 */
	private $_manager;
}
