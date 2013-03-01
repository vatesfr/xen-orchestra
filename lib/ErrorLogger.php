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

use \Monolog\Logger;

/**
 *
 */
final class ErrorLogger extends Base
{
	/**
	 *
	 */
	function __construct(Logger $logger)
	{
		parent::__construct();

		$this->_logger = $logger;
	}

	/**
	 * Handles fatal errors on shutdown.
	 */
	function handleShutdown()
	{
		$e = error_get_Last();
		if ((($e['type'] === E_ERROR) || ($e['type'] === E_USER_ERROR))
		    && ($e !== $this->_last))
		{
			$this->log($e['type'], $e['message'], $e['file'], $e['line']);
		}
	}

	/**
	 *
	 */
	function log($no, $str, $file, $line)
	{
		static $map = array(
			E_NOTICE            => Logger::NOTICE,
			E_USER_NOTICE       => Logger::NOTICE,
			E_WARNING           => Logger::WARNING,
			E_CORE_WARNING      => Logger::WARNING,
			E_USER_WARNING      => Logger::WARNING,
			E_ERROR             => Logger::ERROR,
			E_USER_ERROR        => Logger::ERROR,
			E_CORE_ERROR        => Logger::ERROR,
			E_RECOVERABLE_ERROR => Logger::ERROR,
			E_STRICT            => Logger::DEBUG,
		);

		// Used to prevents the last error from being logged twice.
		$this->_last = array(
			'type'    => $no,
			'message' => $str,
			'file'    => $file,
			'line'    => $line
		);

		$priority = isset($map[$no])
			? $map[$no]
			: Logger::WARNING
			;

		// Appends the location if necessary.
		if (!preg_match('/(?:at|in) [^ ]+:[0-9]+$/', $str))
		{
			$str .= " in $file:$line";
		}

		$this->_logger->addRecord($priority, $str, array(
			'no'   => $no,
			'file' => $file,
			'line' => $line,
		));

		return false;
	}

	/**
	 *
	 */
	private $_last;

	/**
	 * @var Logger
	 */
	private $_logger;
}
