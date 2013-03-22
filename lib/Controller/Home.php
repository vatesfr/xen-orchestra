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
final class Home extends \Controller
{
	/**
	 *
	 */
	function indexAction()
	{
		return array(
			'index' => true,
		);
	}

	/**
	 *
	 */
	function sessionAction()
	{
		$app = $this->_sl->get('application');
		$tm  = $this->_sl->get('template.manager');

		$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : false;

		if (!$referer)
		{
			$tm->build('/_generic/error.templet')->render();
			return;
		}

		// @todo Does not work anymore.
		$self =
			(isset($_SERVER['https']) ? 'https' : 'http').
			'://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'];
		if ($referer === $self)
		{
			$referer = false;
		}

		if (isset($_POST['name'], $_POST['password']))
		{
			if (!$app->logIn($_POST['name'], $_POST['password']))
			{
				$tm->build('/_generic/error.templet')->render(array(
					'error'   => 'Log in failed',
					// @todo 'message' => '',
					'referer' => $referer,
				));
				return;
			}
		}
		else
		{
			$app->logOut();
		}

		return $this->_redirectToURL($referer ?: './');
	}
}
