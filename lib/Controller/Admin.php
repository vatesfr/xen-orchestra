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
 * @author Julien Lambert <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

namespace Controller;

/**
 *
 */
final class Admin extends ControllerAbstract
{
	function dispatch($action)
	{
		/* if ($action !== 'logIn') */
		/* { */
		/* 	return $this->_redirectTo('admin', 'logIn'); */
		/* } */

		return parent::dispatch($action);
	}

	/**
	 *
	 */
	function indexAction()
	{
		return array(
			'admin'     => true,
			'dashboard' => true,
		);
	}

	/**
	 *
	 */
	function appsAction()
	{
		return array(
			'admin' => true,
			'apps'  => true,
		);
	}

	/**
	 *
	 */
	function eventsAction()
	{
		return array(
			'admin'  => true,
			'events' => true,
		);
	}

	/**
	 *
	 */
	function groupsAction()
	{
		return array(
			'admin'  => true,
			'groups' => true,
		);
	}

	/**
	 *
	 */
	function hostsAction()
	{
		return array(
			'admin' => true,
			'hosts' => true,
		);
	}

	/**
	 *
	 */
	function policiesAction()
	{
		return array(
			'admin'    => true,
			'policies' => true,
		);
	}

	/**
	 *
	 */
	function usersAction()
	{
		$xo = $this->_sl->get('xo');

		$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : false;

		if (isset($_GET['a']))
		{
			$action = $_GET['a'];
			try
			{
				if ($action === 'update')
				{
					$delete = isset($_POST['delete'])
						? $_POST['delete']
						: array();
					$old_perm = $_POST['old_perm'];
					$new_perm = $_POST['new_perm'];

					foreach ($delete as $id => $_)
					{
						unset($new_perm[$id]);
						$xo->user->delete($id);
					}
					foreach ($new_perm as $id => $value)
					{
						if ($old_perm[$id] !== $value)
						{
							$xo->user->set($id, array(
								'permission' => $value,
							));
						}
					}
					return $this->_redirectToURL($referer ?: './');
				}
				if ($action === 'create')
				{
					$xo->user->create($_POST['name'], $_POST['password'], $_POST['permission']);
					return $this->_redirectToURL($referer ?: './');
				}
			}
			catch (XO_Exception $e)
			{
				$this->_sl->get('template.manager')
					->build('/_generic/error.templet')
					->render(array(
						'error'   => ucfirst($action).' failed',
						'message' => $e->getMessage(),
						'referer' => $referer,
					));
				return;
			}
		}


		$users = $xo->user->getAll();
		foreach ($users as &$user)
		{
			$user = (object) $user; // Template system only handles objects.
		}

		return array(
			'admin' => true,
			'menu_admin_users' => true,
			'users' => $users,
			'permissions' => array(
				'None'           => 'none',
				'Read'           => 'read',
				'Write'          => 'write',
				'Administration' => 'admin',
			),
		);
	}
}
