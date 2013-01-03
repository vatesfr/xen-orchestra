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
final class Config extends Base
{
	/**
	 *
	 */
	function __construct(array $entries = null)
	{
		parent::__construct();

		$this->_entries = isset($entries) ? $entries : array();
	}

	/**
	 * Returns an entry.
	 *
	 * @param string $path
	 * @param mixed  $default Optional.
	 *
	 * @return array
	 *
	 * @throws Exception If there is no such entry and no default value as been
	 *     specified.
	 */
	function get($path, $default = 'throws an exception')
	{
		$entry = $this->_entries;

		$parts = explode('.', $path);
		foreach ($parts as $part)
		{
			/*
			 * Nothing found.
			 */
			if (!isset($entry[$part])
			    && !array_key_exists($part, $entry))
			{
				if (func_num_args() < 2)
				{
					throw new Exception('no such entry ('.$path.')');
				}

				$entry = $default;
				break;
			}

			$entry = $entry[$part];
		}

		return $this->_resolve($entry);
	}

	/**
	 *
	 *
	 * @param string       $path
	 * @param array|string $value
	 */
	function set($path, $value)
	{
		$entry = &$this->_entries;

		$parts = explode('.', $path);

		$i = 0;
		$n = count($parts);
		while (
			($i < $n)
			&& (
				isset($entry[$part = $parts[$i]])
				|| (
					is_array($entry)
					&& array_key_exists($part, $entry)
				)
			)
		)
		{
			$entry = &$entry[$part];
			++$i;
		}

		while ($i < $n)
		{
			if (!is_array($entry))
			{
				$entry = array();
			}

			$entry = &$entry[$parts[$i]];
			++$i;
		}

		$entry = $value;
	}

	/**
	 * @var array
	 */
	private $_entries;

	/**
	 *
	 */
	private function _replaceCallback(array $match)
	{
		return $this->get($match[1]);
	}

	/**
	 *
	 */
	private function _resolve($entry)
	{
		if (is_string($entry))
		{
			return preg_replace_callback(
				'/#\{([-a-zA-Z0-9_.]+)\}/',
				array($this, '_replaceCallback'),
				$entry
			);
		}

		if (is_array($entry))
		{
			foreach ($entry as &$item)
			{
				$item = $this->_resolve($item);
			}
		}

		return $entry;
	}
}
