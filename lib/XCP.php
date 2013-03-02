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
 *
 */
final class XCP extends Base
{
	/**
	 *
	 */
	function __construct(Loop $loop, $url, $user, $password)
	{
		parent::__construct();

		$this->_loop = $loop;
		$this->_url  = $url;

		$this->_queue[] = array(
			array($this, '_setToken'),
			'session.login_with_password',
			array($user, $password)
		);
		$this->_next();
	}

	/**
	 *
	 */
	function queue($method, array $params = null, $callback = null)
	{
		($params !== null)
			or $params = array();

		$this->_queue[] = array($callback, $method, $params);

		if (count($this->_queue) === 1)
		{
			$this->_next();
		}
	}

	/**
	 *
	 */
	function onData($handle)
	{
		$this->_buf .= stream_get_contents($handle);

		if (!feof($handle))
		{
			return;
		}

		// Reads the response.
		list(, $response) = explode("\r\n\r\n", $this->_buf, 2);
		$this->_buf = '';
		$response = xmlrpc_decode($response);
		if (!isset($response['Value']))
		{
			var_export($response);
			trigger_error(
				'Invalid response',
				E_USER_ERROR
			);
		}
		$response = $response['Value'];

		// Notifies.
		$request = array_shift($this->_queue);
		if ($request[0] !== null)
		{
			$callback = $request[0];
			$result = $callback($response, $this);
			if ($result === true)
			{
				$this->_queue[] = $request;
			}
		}

		// Sends the next request if any.
		if ($this->_queue)
		{
			$this->_next();
		}

		// Stops reading this socket.
		return false;
	}

	/**
	 *
	 */
	private function _next()
	{
		$_ = parse_url($this->_url);
		$https = isset($_['scheme']) && !strcasecmp($_['scheme'], 'https');
		$port  = isset($_['port']) ? $_['port'] : ($https ? 443 : 80);
		$host  = isset($_['host']) ? $_['host'] : '127.0.0.1';
		$query = isset($_['query']) ? '?'.$_['query'] : '';
		$path  = isset($_['path']) ? $_['path'] : '/';

		list(, $method, $params) = reset($this->_queue);
		isset($this->_tok)
			and array_unshift($params, $this->_tok);

		$data = xmlrpc_encode_request($method, $params, array(
			'verbosity' => 'no_white_space',
			'encoding'  => 'UTF-8',
		));

		$request = implode("\r\n", array(
			"POST $path HTTP/1.1",
			"Host: $host:$port",
			'Connection: close',
			'Content-Type: text/xml; charset=UTF-8',
			'Content-Length: '.strlen($data),
			'',
			$data
		));

		$hdl = @stream_socket_client(
			($https ? 'tls' : 'tcp')."://$host:$port",
			/* out */ $errno,
			/* out */ $errstr,
			ini_get('default_socket_timeout'), // Default value.
			STREAM_CLIENT_CONNECT | STREAM_CLIENT_ASYNC_CONNECT
		);
		if (!$hdl)
		{
			trigger_error(
				"cannot connect to {$this->_url}: $errno - $errstr",
				E_USER_ERROR
			);
		}

		stream_set_blocking($hdl, false);
		fwrite($hdl, $request);

		$this->_loop->addRead($hdl, array($this, 'onData'));
	}

	/**
	 *
	 */
	private function _setToken($token)
	{
		$this->_tok = $token;
	}

	/**
	 * @var string
	 */
	private $_buf = '';

	/**
	 * @var Loop
	 */
	private $_loop;

	/**
	 * @var string
	 */
	private $_url;

	/**
	 * Session token.
	 *
	 * @var string
	 */
	private $_tok;

	/**
	 * @var array
	 */
	private $_queue = array();
}
