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
final class Client extends Base
{
	/**
	 *
	 */
	public $uid = null;

	/**
	 * @param Loop       $loop
	 * @param resource   $handle
	 * @param callable[] $methods
	 */
	function __construct(Loop $loop, $handle, $methods)
	{
		parent::__construct();

		$this->_loop     = $loop;
		$this->_handle   = $handle;
		$this->_methods = $methods;

		stream_set_blocking($this->_handle, false);
		$loop->addRead($this->_handle, array($this, '_onRead'));
	}

	/**
	 *
	 */
	function isAuthenticated()
	{
		return (null !== $this->uid);
	}

	/**
	 *
	 */
	function notify($method, array $params)
	{
		$this->_send(array(
			'method'  => $method,
			'params'  => $params
		));
	}

	/**
	 *
	 */
	function respond($id, $result)
	{
		if ($id === null)
		{
			trigger_error(
				'notifications do not expect responses',
				E_USER_ERROR
			);
		}

		$this->_send(array(
			'id'     => $id,
			'result' => $result
		));
	}

	////////////////////////////////////////
	//
	////////////////////////////////////////

	/**
	 * This function is called when data become available on the
	 * connection.
	 *
	 * Its name starts with a “_” because it is only supposed to be
	 * used internally (it is not private because of PHP limits).
	 */
	function _onRead()
	{
		// Read the message length.
		if (!$this->_len)
		{
			$len = stream_get_line($this->_handle, 1024, "\n");
			if (($false === len)
				|| ('' === $len)) // @todo Not sure why but it seems necessary.
			{
				if (feof($this->_handle))
				{
					echo "client disconnected\n";

					// Closes this socket and stops listening to it.
					stream_socket_shutdown($this->_handle, STREAM_SHUT_RDWR);
					fclose($this->_handle);
					return false;
				}

				$this->_error('failed to read the request length');
			}
			if (!ctype_digit($len)
			    || ($len <= 0))
			{
				$this->_error('invalid request length');
			}

			$this->_len = (int) $len;
		}

		$buf = @fread($this->_handle, $this->_len);
		if ($buf === false)
		{
			$this->_error('failed to read the request');
		}
		$this->_buf .= $buf;
		$this->_len -= strlen($buf);

		if ($this->_len !== 0)
		{
			return;
		}

		$request = @json_decode($this->_buf, true);
		$this->_buf = '';

		if ($request === null)
		{
			$this->_warning(null, -32700, 'Parse error');
			return;
		}

		if (!isset($request['jsonrpc'], $request['method'])
		    || ($request['jsonrpc'] !== '2.0'))
		{
			$this->_warning(null, -32600, 'Invalid request');
			return;
		}

		$id     = isset($request['id']) ? $request['id'] : null;
		$method = $request['method'];
		$params = isset($request['params']) ? $request['params'] : array();

		if (isset($this->_methods[$method]))
		{
			$error = call_user_func(
				$this->_methods[$method],
				$id, $params, $this
			);
		}
		else
		{
			$error = array(-32601, 'Method not found', $method);
		}

		if (($error === null)
		    || ($id === null))
		{
			// No errors or this was a notification (no error handling).
			return;
		}

		$errors = array(
			-32602 => array(
				'Invalid params',
				$params
			),
		);
		if (is_numeric($error) && isset($errors[$error]))
		{
			$error = $errors[$error];
		}
		elseif (!is_array($error) || !isset($error[0], $error[1]))
		{
			trigger_error(
				'invalid error',
				E_USER_ERROR
			);
		}
		$this->_warning(
			$id,
			$error[0],
			$error[1],
			isset($error[2]) ? $error[2] : null
		);
	}

	/**
	 * @var Loop
	 */
	private $_loop;

	/**
	 * @var resource
	 */
	private $_handle;

	/**
	 * @var callable[]
	 */
	private $_methods;

	/**
	 * @var integer
	 */
	private $_len;

	/**
	 * @var string|null
	 */
	private $_buf;

	/**
	 *
	 */
	private function _error($message)
	{
		throw new Exception($message);
	}

	/**
	 * @param array $message
	 */
	private function _send($message)
	{
		$message['jsonrpc'] = '2.0';
		$message = json_encode($message);

		$data = strlen($message)."\n".$message;
		$len  = strlen($data);

		$written = @fwrite($this->_handle, $data, $len);
		if ($written === false)
		{
			$this->_error('failed to send the message');
		}

		$len -= $written;
		if ($len)
		{
			echo "$len bytes to write, using a buffered writer\n";
			$this->_loop->addWrite(
				$this->_handle,
				array(
					new BufferedWriter(substr($data, -$len), $len),
					'onWrite'
				)
			);
		}
	}

	/**
	 *
	 */
	private function _warning($id, $code, $message, $data = null)
	{
		$message = array(
			'id'    => $id,
			'error' => array(
				'code'    => $code,
				'message' => $message
			)
		);
		($data !== null)
			and $message['error']['data'] = $data;

		$this->_send($message);
	}
}
