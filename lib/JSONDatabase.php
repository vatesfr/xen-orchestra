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

final class JSONDatabase extends \Rekodi\Manager\Memory
{
	/**
	 *
	 */
	static function factory($file)
	{
		if (file_exists($file))
		{
			$data = @file_get_contents($file);
			if ((false === $data)
				|| (null === ($data = json_decode($data, true))))
			{
				trigger_error(
					'could not read the database',
					E_USER_ERROR
				);
			}

			$manager = static::createFromState($data);
		}
		else
		{
			$manager = new static;

			// Create tables.
			$manager->createTable('tokens', function ($table) {
				$table
					->string('id')->unique()
					->integer('expiration')
					->string('user_id')
				;
			});
			$manager->createTable('users', function ($table) {
				$table
					->integer('id')->autoIncremented()
					->string('name')->unique()
					->string('password')
					->integer('permission')
				;
			});

			// Insert initial data.
			$manager->create('users', array(
				array(
					'name'       => 'admin',
					'password'   => '$2y$10$VzBQqiwnhG5zc2.MQmmW4ORcPW6FE7SLhPr1VBV2ubn5zJoesnmli',
					'permission' => \Bean\User::ADMIN,
				),
			));

			trigger_error(
				'no existing database, creating default user (admin:admin)',
				E_USER_WARNING
			);
		}

		$manager->_file = $file;
		return $manager;
	}

	/**
	 *
	 */
	function createTable($name, $callback)
	{
		$result = parent::createTable($name, $callback);
		$this->_save();
		return $result;
	}

	/**
	 *
	 */
	function deleteTable($name)
	{
		$result = parent::deleteTable($name);
		$this->_save();
		return $result;
	}

	/**
	 *
	 */
	function create($table, array $entries)
	{
		$result = parent::create($table, $entries);
		$this->_save();
		return $result;
	}

	/**
	 *
	 */
	function delete($table, array $filter)
	{
		$result = parent::delete($table, $filter);
		$this->_save();
		return $result;
	}

	/**
	 *
	 */
	function update($table, array $filter, array $properties)
	{
		$result = parent::update($table, $filter, $properties);
		$this->_save();
		return $result;
	}

	/**
	 *
	 */
	private $_file;

	/**
	 *
	 */
	private function _save()
	{
		if (!$this->_file)
		{
			return;
		}

		$bytes = @file_put_contents(
			$this->_file,
			json_encode($this->getState())
		);
		if (!$bytes)
		{
			trigger_error(
				'could not write the database',
				E_USER_ERROR
			);
		}
	}
}
