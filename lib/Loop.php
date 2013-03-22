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

/**
 *
 */
final class Loop extends Base
{
	function __construct()
	{
		parent::__construct();
	}

	/**
	 * @param resource $handle
	 * @param callable $callback
	 */
	function addRead($handle, $callback)
	{
		$id = (int) $handle;

		$this->_readHandles[$id]   = $handle;
		$this->_readCallbacks[$id] = $callback;
	}

	/**
	 *
	 */
	function removeRead($handle)
	{
		$id = (int) $handle;

		unset(
			$this->_readHandles[$id],
			$this->_readCallbacks[$id]
		);
	}

	/**
	 * @param resource $handle
	 * @param callable $callback
	 */
	function addWrite($handle, $callback)
	{
		$id = (int) $handle;

		$this->_writeHandles[$id]   = $handle;
		$this->_writeCallbacks[$id] = $callback;
	}

	/**
	 *
	 */
	function removeWrite($handle)
	{
		$id = (int) $handle;

		unset(
			$this->_writeHandles[$id],
			$this->_writeCallbacks[$id]
		);
	}

	/**
	 *
	 */
	function remove($handle)
	{
		$id = (int) $handle;

		unset(
			$this->_readHandles[$id],
			$this->_readCallbacks[$id],
			$this->_writeHandles[$id],
			$this->_writeCallbacks[$id]
		);
	}

	/**
	 * @param mixed $user_data
	 */
	function run($user_data = null)
	{
		$this->_running = true;

		do
		{
			$read   = $this->_readHandles;
			$write  = $this->_writeHandles;
			$except = null;
			if (@stream_select($read, $write, $except, null) === false)
			{
				trigger_error(
					'error while waiting for activity',
					E_USER_ERROR
				);
			}

			foreach ($read as $handle)
			{
				$result = call_user_func(
					$this->_readCallbacks[(int) $handle],
					$handle, $user_data
				);

				if (!is_resource($handle))
				{
					$this->remove($handle);
				}
				elseif ($result === false)
				{
					$this->removeRead($handle);
				}
			}
			foreach ($write as $handle)
			{
				$result = call_user_func(
					$this->_writeCallbacks[(int) $handle],
					$handle, $user_data
				);

				if (!is_resource($handle))
				{
					$this->remove($handle);
				}
				elseif ($result === false)
				{
					$this->removeWrite($handle);
				}
			}
		} while ($this->_running
		         && ($this->_readHandles || $this->_writeHandles));
	}

	/**
	 * @var boolean
	 */
	private $_running;

	/**
	 * @var resource[]
	 */
	private $_readHandles = array();

	/**
	 * @var callable[]
	 */
	private $_readCallbacks = array();

	/**
	 * @var resource[]
	 */
	private $_writeHandles = array();

	/**
	 * @var callable[]
	 */
	private $_writeCallbacks = array();
}
