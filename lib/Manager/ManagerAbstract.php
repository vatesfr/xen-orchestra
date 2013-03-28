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

namespace Manager;

/**
 *
 */
abstract class ManagerAbstract
{
	/**
	 *
	 */
	protected function __construct(\Rekodi\Manager $database, $table, $bean)
	{
		$this->_database = $database;
		$this->_table    = $table;
		$this->_bean     = $bean;
	}

	/**
	 *
	 */
	function __destruct()
	{}

	/**
	 *
	 */
	function create(array $properties)
	{
		$class = $this->_bean;
		$bean  = new $class($properties, true);

		$new_props = $this->_database->create(
			$this->_table,
			array($bean->getProperties())
		);

		$bean->set($new_props[0]);
		$bean->markAsClean();
		return $bean;
	}

	/**
	 *
	 */
	function count(array $filter = null)
	{
		return $this->_database->count(
			$this->_table,
			$filter
		);
	}

	/**
	 *
	 */
	function createOrUpdate(array $properties)
	{
		$bean = $this->get($properties['id'], false);
		if (!$bean)
		{
			return $this->create($properties);
		}

		$bean->set($properties, true);
		$this->save($bean);
		return $bean;
	}

	/**
	 *
	 */
	function delete($id)
	{
		$n = $this->_database->delete($this->_table, array('id' => $id));

		if (1 !== $n)
		{
			trigger_error(
				'unexpected number of deleted '.$this->_table.' ('.$n.')',
				E_USER_ERROR
			);
		}
	}

	/**
	 * @param string|array $filter Either the id of the entry to get or a
	 *     filter it must match.
	 *
	 * @return boolean
	 */
	function exists($filter)
	{
		if (!is_array($filter))
		{
			$filter = array('id' => $filter);
		}

		// @todo Handle limit in Rekodi.
		return $this->_database->count(
			$this->_table,
			$filter
		);
	}

	/**
	 * @param string|array $filter Either the id of the entry to get or a
	 *     filter it must match.
	 * @param mixed $default Value returned if no entry has been found.
	 *
	 * @return Bean|mixed
	 */
	function first($filter, $default = 'fatal error')
	{
		if (!is_array($filter))
		{
			$filter = array('id' => $filter);
		}

		$entries = $this->get($filter);
		if ($entries)
		{
			return $entries[0];
		}

		if (func_num_args() >= 2)
		{
			return $default;
		}

		foreach ($filter as $field => &$value)
		{
			$value = $field.'='.var_export($value, true);
		}
		trigger_error(
			'no such '.$this->_table.' ('.implode(', ', $filter).')',
			E_USER_ERROR
		);
	}

	/**
	 * @param array $filter Filter the entries must match.
	 *
	 * @return Bean[]
	 */
	function get(array $filter = array())
	{
		$entries = $this->_database->get(
			$this->_table,
			$filter
		);

		$class = $this->_bean;
		foreach ($entries as &$entry)
		{
			$entry = new $class($entry, true);
		}
		return $entries;
	}

	/**
	 *
	 */
	function getArray($filter = null, $fields = null)
	{
		return $this->_database->get(
			$this->_table,
			$filter,
			$fields
		);
	}

	/**
	 *
	 */
	function save(\Rekodi\Bean $bean)
	{
		$dirty = $bean->getDirty();
		if (!$dirty)
		{
			// Nothing has changed.
			return;
		}

		$n = $this->_database->update(
			$this->_table,
			array('id' => $bean->id),
			$bean->getDirty()
		);

		if (1 !== $n)
		{
			trigger_error(
				'unexpected number of updated '.$this->_table.' ('.$n.')',
				E_USER_ERROR
			);
		}
	}

	/**
	 * @var \Rekodi\Manager
	 */
	protected $_database;

	/**
	 * @var string
	 */
	protected $_table;

	/**
	 * @var string
	 */
	protected $_bean;
}
