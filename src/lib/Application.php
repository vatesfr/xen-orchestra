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
final class Application extends Base
{
	/**
	 *
	 */
	function __construct(DI $di)
	{
		parent::__construct();

		session_start();

		$this->_di = $di;
	}

	/**
	 *
	 */
	function getCurrentUser()
	{
		return isset($_SESSION['user']['name'])
			? $_SESSION['user']['name']
			: false;
	}

	/**
	 *
	 */
	function getTemplate($template)
	{
		$template = $this->_di->get('template.manager')->build($template);
		$template->variables['user'] = $this->getCurrentUser();

		return $template;
	}

	/**
	 *
	 */
	function logIn($name, $password)
	{
		$xo = $this->_di->get('xo');

		if (!$xo->logIn($name, $password))
		{
			return false;
		}
		$_SESSION['user']['name']     = $name;
		$_SESSION['user']['password'] = $password;

		return true;
	}

	/**
	 *
	 */
	function logOut()
	{
		session_destroy();

		return true;
	}

	/**
	 *
	 */
	function redirect($url)
	{
		header("Location: $url");
	}

	/**
	 * @var DI
	 */
	private $_di;
}
