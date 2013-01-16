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

$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : false;

if (!$referer)
{
	$application->getTemplate('/_generic/error.html')->render();
	return;
}

$self =
	(isset($_SERVER['https']) ? 'https' : 'http').
	'://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'];
if ($referer === $self)
{
	$referer = false;
}


if (isset($_POST['name'], $_POST['password']))
{
	if (!$application->logIn($_POST['name'], $_POST['password']))
	{
		$application->getTemplate('/_generic/error.html')->render(array(
			'error'   => 'Log in failed',
			// @todo 'message' => '',
			'referer' => $referer,
		));
		return;
	}
}
else
{
	$application->logOut();
}

$application->redirect($referer ?: './');
