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
abstract class ControllerAbstract
{
	/**
	 *
	 */
	function __construct(\ServiceLocator $sl)
	{
		$this->_sl = $sl;
	}

	/**
	 *
	 */
	public function __destruct()
	{}

	/**
	 *
	 */
	public function dispatch($action, array $route_parameters)
	{
		$response = $this->{$action.'Action'}($route_parameters);

		if (is_array($response))
		{
			$name = strtolower(
				strtr(
					substr(                // Remove “Controller\”.
						get_class($this),
						11
					),
					'\\',
					'_'
				)
			);

			$this->_sl->get('template.manager')
				->build("/$name/$action.templet")
				->render($response);
		}
		elseif ($response instanceof \Response\Redirect)
		{
			header('Location: '.$response->url, $response->code);
		}
	}

	//--------------------------------------

	/**
	 * @var ServiceLocator
	 */
	protected $_sl;

	/**
	 *
	 */
	protected function _redirectToURL($url)
	{
		return new \Response\Redirect($url);
	}

	/**
	 *
	 */
	protected function _redirectTo(
		$controller,
		$action,
		array $parameters = array()
	)
	{
		$parameters['controller'] = $controller;
		($action)
			or $parameters['action'] = $action;

		// @todo Prefix base url.
		$url = $this->_sl->get('routes')->build('default', $parameters);
		return $this->_redirectToURL($url);
	}
}
