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

/**
 * Dependency injector.
 */
final class DI extends Base
{
	function __construct()
	{
		parent::__construct();
	}

	function get($id)
	{
		if (isset($this->_entries[$id])
		    || array_key_exists($id, $this->_entries))
		{
			return $this->_entries[$id];
		}

		$tmp = str_replace(array('_', '.'), array('', '_'), $id);

		if (method_exists($this, '_get_'.$tmp))
		{
			return $this->{'_get_'.$tmp}();
		}

		if (method_exists($this, '_init_'.$tmp))
		{
			$value = $this->{'_init_'.$tmp}();
			$this->set($id, $value);
			return $value;
		}

		throw new Exception('no such entry: '.$id);
	}

	function set($id, $value)
	{
		$this->_entries[$id] = $value;
	}

	private $_entries = array();

	////////////////////////////////////////

	private function _init_application()
	{
		return new Application($this);
	}

	private function _init_errorLogger()
	{
		return new ErrorLogger($this->get('logger'));
	}

	private function _init_logger()
	{
		$logger = new \Monolog\Logger('main');

		$config = $this->get('config');
		if ($email = $config->get('log.email', false))
		{
			$logger->pushHandler(
				new \Monolog\Handler\FingersCrossedHandler(
					new \Monolog\Handler\NativeMailerHandler(
						$email,
						'[XO Server]',
						'no-reply@vates.fr',
						\Monolog\Logger::DEBUG
					),
					\Monolog\Logger::WARNING
				)
			);
		}
		if ($file = $config->get('log.file', false))
		{
			$logger->pushHandler(
				new \Monolog\Handler\StreamHandler($file)
			);
		}

		return $logger;
	}

	private function _init_loop()
	{
		return new Loop;
	}
}
