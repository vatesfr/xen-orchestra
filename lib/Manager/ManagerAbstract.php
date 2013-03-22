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
	protected function __construct(\Rekodi\Manager $manager, $table, $bean)
	{
		$this->_manager = $manager;
		$this->_table   = $table;
		$this->_bean    = $bean;
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

		$new_props = $this->_manager->create(
			$this->_table,
			array($bean->getProperties())
		);

		if (count($new_props) !== 1)
		{
			trigger_error(
				'unexpected number of created '.$this->_table.' ('.$n.')',
				E_USER_ERROR
			);
		}

		$bean->set($new_props[0]);
		$bean->markAsClean();
		return $bean;
	}

	/**
	 *
	 */
	function delete($id)
	{
		$n = $this->_manager->delete($this->_table, array('id' => $id));

		if (1 !== $n)
		{
			trigger_error(
				'unexpected number of deleted '.$this->_table.' ('.$n.')',
				E_USER_ERROR
			);
		}
	}

	/**
	 *
	 */
	function getBy($field, $value, $default = 'fatal error')
	{
		$beans = $this->_manager->get(
			$this->_table,
			array($field => $value)
		);

		if ($beans)
		{
			$class = $this->_bean;
			return new $class($beans[0], true);
		}

		if (func_num_args() >= 3)
		{
			return $default;
		}

		trigger_error(
			'no such '.$this->_table.' ('.$field.' = '.$value.')',
			E_USER_ERROR
		);

	}

	/**
	 * @param string $id
	 * @param mixed  $default
	 *
	 * @return Bean
	 */
	function get($id, $default = 'fatal error')
	{
		if (func_num_args() === 1)
		{
			return $this->getBy('id', $id);
		}
		return $this->getBy('id', $id, $default);
	}

	/**
	 *
	 */
	function getArray($filter = null, $fields = null)
	{
		return $this->_manager->get(
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

		$n = $this->_manager->update(
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
	private $_manager;

	/**
	 * @var string
	 */
	private $_table;

	/**
	 * @var string
	 */
	private $_bean;
}
