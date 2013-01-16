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
 * @author Olivier Lambert <olivier.lambert@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */
$application = require(__DIR__.'/../bootstrap.php');
$xo = $application->xo;

$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : false;

if (isset($_GET['a']))
{
	$action = $_GET['a'];
	try
	{
		if ($action === 'delete')
		{
			$xo->user->delete($_GET['id']);
			$application->redirect($referer ?: './');
			return;
		}
		if ($action === 'create')
		{
			$xo->user->create($_POST['name'], $_POST['password'], $_POST['permission']);
			$application->redirect($referer ?: './');
			return;
		}
	}
	catch (XO_Exception $e)
	{
		$application->getTemplate('/_generic/error.html')->render(array(
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

$application->getTemplate('/admin/users.html')->render(array(
	'admin' => true,
	'menu_admin_users' => true,
	'users' => $users,
));
