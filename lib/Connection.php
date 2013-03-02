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
abstract class Connection extends Base
{
	/**
	 *
	 */
	function __construct($handle, Loop $loop)
	{
		parent::__construct();

		$this->_handle = $handle;
		$this->_loop   = $loop;
	}

	/**
	 *
	 */
	function __destruct()
	{
		$this->close();

		parent::__destruct();
	}

	/**
	 *
	 */
	final function close()
	{
		$this->_loop->removeRead($this->_handle);
		$this->_loop->removeWrite($this->_handle);

		$this->handleClose();

		if (is_resource($this->_handle))
		{
			stream_socket_shutdown($this->_handle, STREAM_SHUT_RDWR);
			fclose($this->_handle);
		}
	}

	/**
	 *
	 */
	function handleClose()
	{}

	/**
	 * @var resource
	 */
	private $_handle;

	/**
	 * @var Loop
	 */
	private $_loop;
}
