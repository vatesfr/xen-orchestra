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
final class BufferedWriter
{
	/**
	 * @param string $data
	 */
	function __construct($data, $len = null)
	{
		$this->_data = $data;
		$this->_len  = $len ?: strlen($data);
	}

	/**
	 *
	 */
	function onWrite($handle)
	{
		$written = @fwrite(
			$handle,
			$this->_data,
			$this->_len
		);

		if ($written === false)
		{
			// @todo Log error.
			return false;
		}

		$this->_len -= $written;
		if (!$this->_len)
		{
			// Write complete, stops watching this handle.
			return false;
		}

		$this->_data = substr($this->_data, -$this->_len);
	}
}
