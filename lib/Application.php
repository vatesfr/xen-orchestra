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
final class Application extends Base
{
	/**
	 *
	 */
	const NONE = 0;

	/**
	 *
	 */
	const READ = 1;

	/**
	 *
	 */
	const WRITE = 2;

	/**
	 *
	 */
	const ADMIN = 3;

	/**
	 *
	 */
	function __construct(DI $di)
	{
		parent::__construct();

		$this->_di = $di;
	}

	/**
	 *
	 */
	function api_session_signInWithPassword($id, array $params, Client $c)
	{
		// Checks parameters.
		if (!isset($params[0], $params[1]))
		{
			return -32602; // Invalid params.
		}
		list($name, $password) = $params;

		// Checks the client is not already authenticated.
		if ($c->isAuthenticated())
		{
			return array(0, 'already authenticated');
		}

		// Checks the user exists.
		if (!isset($this->_usersByName[$name]))
		{
			return array(1, 'invalid credential');
		}

		$uid  = $this->_usersByName[$name];
		$hash = &$this->_users[$uid]['password'];

		// Checks the password matches.
		if (!password_verify($password, $hash))
		{
			return array(1, 'invalid credential');
		}

		// Checks whether the hash needs to be updated.
		if (password_needs_rehash($hash, PASSWORD_DEFAULT))
		{
			$hash = password_hash($password, PASSWORD_DEFAULT);
			$this->_saveDatabase();
		}

		// Marks the client as authenticated.
		$c->uid = $uid;

		// Returns success.
		$c->respond($id, true);
	}

	/**
	 *
	 */
	function api_session_signInWithToken($id, array $params, Client $c)
	{
		// Checks parameters.
		if (!isset($params[0]))
		{
			return -32602; // Invalid params.
		}
		$token = $params[0];

		// Checks the client is not already authenticated.
		if ($c->isAuthenticated())
		{
			return array(0, 'already authenticated');
		}

		// Checks the token exists.
		if (!isset($this->_tokens[$token]))
		{
			return array(1, 'invalid token');
		}

		$record = $this->_tokens[$token];

		// Checks the token is valid.
		if ($record['expiration'] < time())
		{
			unset($this->_tokens[$token]);
			return array(1, 'invalid token');
		}

		// Marks the client as authenticated.
		$c->uid = $record['uid'];

		// Returns success.
		$c->respond($id, true);
	}

	/**
	 *
	 */
	function api_session_getUser($id, array $params, Client $c)
	{
		if (!$c->isAuthenticated())
		{
			return array(0, 'not authenticated');
		}

		$c->respond($id, array(
			'id'         => (string) $c->uid,
			'name'       => $this->_users[$c->uid]['name'],
			'permission' => $this->_users[$c->uid]['permission'],
		));
	}

	/**
	 *
	 */
	function api_session_createToken($id, array $params, Client $c)
	{
		// Checks the client is authenticated.
		if (!$c->isAuthenticated())
		{
			return array(0, 'not authenticated');
		}

		// Generates the token and makes sure it is unique.
		do
		{
			/* If available, we use OpenSSL to create more secure tokens.
			 *
			 * @todo Move the “if” outside of this function and furthermore of
			 * this loop for performance concerns.
			 */
			if (function_exists('openssl_random_pseudo_bytes'))
			{
				$token = bin2hex(openssl_random_pseudo_bytes(32));
			}
			else
			{
				$token = uniqid('', true);
			}
		} while (isset($this->_tokens[$token]));

		// Registers it.
		$this->_tokens[$token] = array(
			'expiration' => time() + 604800, // One week
			'uid'        => $c->uid,
		);
		$this->_saveDatabase();

		// Returns it.
		$c->respond($id, $token);
	}

	/**
	 *
	 */
	function api_session_destroyToken($id, array $params, Client $c)
	{
		// Checks the token exists.
		if (!isset($this->_tokens[$token]))
		{
			return array(0, 'invalid token');
		}

		// Deletes it.
		unset($this->_tokens[$token]);
		$this->_saveDatabase();

		// Returns success.
		$c->respond($id, true);
	}

	/**
	 *
	 */
	function api_user_create($id, array $params, Client $c)
	{
		// Checks parameters.
		if (!isset($params[0], $params[1]))
		{
			return -32602; // Invalid params.
		}
		list($name, $password) = $params;

		// Checks credentials.
		if (!$c->isAuthenticated()
		    || !$this->_checkPermission($c->uid, self::ADMIN))
		{
			return array(0, 'not authorized');
		}

		// Checks the provided user name.
		if (!is_string($name)
			|| !preg_match('/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/', $name))
		{
			return array(1, 'invalid user name');
		}

		// Checks the provided password.
		if (!is_string($password)
		    || !preg_match('/^.{8,}$/', $password))
		{
			return array(2, 'invalid password');
		}

		// Checks provided permission.
		if (isset($params[2]))
		{
			$permission = self::_permissionFromString($params[2]);
			if ($permission === false)
			{
				return array(3, 'invalid permission');
			}
		}
		else
		{
			$permission = self::NONE;
		}

		// Checks if the user name is already used.
		if (isset($this->_usersByName[$name]))
		{
			return array(4, 'user name already taken');
		}

		// Creates the user.
		$this->_users[] = array(
			'name'       => $name,
			'password'   => password_hash($password, PASSWORD_DEFAULT),
			'permission' => $permission,
		);
		end($this->_users);
		$uid = (string) key($this->_users);
		$this->_usersByName[$name] = $uid;
		$this->_saveDatabase();

		// Returns the identifier.
		$c->respond($id, $uid);
	}

	/**
	 *
	 */
	function api_user_delete($id, array $params, Client $c)
	{
		// Checks parameter.
		if (!isset($params[0]))
		{
			return -32602; // Invalid params.
		}
		$uid = $params[0];

		// Checks credentials.
		if (!$c->isAuthenticated()
		    || !$this->_checkPermission($c->uid, self::ADMIN))
		{
			return array(0, 'not authorized');
		}

		// Checks user exists and is not the current user.
		if (!isset($this->_users[$uid])
		    || ($uid === $c->uid))
		{
			return array(1, 'invalid user');
		}

		// Deletes the user.
		$name = $this->_users[$uid]['name'];
		unset($this->_users[$uid], $this->_usersByName[$name]);
		$this->_saveDatabase();

		// Returns success.
		$c->respond($id, true);
	}

	/**
	 *
	 */
	function api_user_changePassword($id, array $params, Client $c)
	{
		// Checks parameters.
		if (!isset($params[0], $params[1]))
		{
			return -32602; // Invalid params.
		}
		list($old, $new) = $params;

		// Checks the client is authenticated.
		if (!$c->isAuthenticated())
		{
			return array(0, 'not authenticated');
		}

		$hash = &$this->_users[$c->uid]['password'];

		// Checks the old password matches.
		if (!password_verify($old, $hash))
		{
			return array(1, 'invalid credential');
		}

		// Checks the new password is valid.
		if (!is_string($new)
		    || !preg_match('/^.{8,}$/', $new))
		{
			return array(2, 'invalid password');
		}

		$hash = password_hash($new, PASSWORD_DEFAULT);
		$this->_saveDatabase();

		// Returns success.
		$c->respond($id, true);
	}

	/**
	 *
	 */
	function api_user_getAll($id, array $params, Client $c)
	{
		// Checks credentials.
		if (!$c->isAuthenticated()
		    || !$this->_checkPermission($c->uid, self::ADMIN))
		{
			return array(0, 'not authorized');
		}

		$users = array();
		foreach ($this->_users as $uid => $user)
		{
			$users[] = array(
				'id'         => $uid,
				'name'       => $user['name'],
				'permission' => self::_permissionToString($user['permission']),
			);
		}
		$c->respond($id, $users);
	}

	/**
	 *
	 */
	function api_vm_getAll($id, array $params, Client $c)
	{
		// @todo Handles parameter.

		$c->respond($id, $this->_xenVms);
	}

	/**
	 *
	 */
	function handleServer($handle, $data)
	{
		if (feof($handle))
		{
			// Stops listening to this socket.
			return false;
		}

		$handle = @stream_socket_accept($handle, 10);
		if (!$handle)
		{
			trigger_error(
				'error while handling an incoming connection',
				E_USER_ERROR
			);
		}

		/* Here we build a map for all available methods.
		 *
		 * This technic provides fast case sensitive matching (compare to
		 * “is_callable()”).
		 */
		static $methods;
		if ($methods === null)
		{
			$methods = array();
			foreach (get_class_methods($this) as $method)
			{
				if (!substr_compare($method, 'api_', 0, 4))
				{
					$_ = strtr(substr($method, 4), '_', '.');
					$methods[$_] = array($this, $method);
				}
			}
		}

		new Client(
			$data['loop'],
			$handle,
			$methods
		);

		echo "new client connected\n";
	}

	/**
	 *
	 */
	function handleXenEvents(array $events)
	{
		static $keys;

		$objects = array();

		foreach ($events as $event)
		{
			$_ = array_keys($event);
			if (!$keys)
			{
				$keys = $_;
				var_export($keys); echo PHP_EOL;
			}
			elseif ($_ !== $keys)
			{
				$keys = array_intersect($keys, $_);
				var_export($keys); echo PHP_EOL;
			}

			$class    = $event['class'];
			$ref      = $event['ref'];
			$snapshot = $event['snapshot']; // Not present in the documentation.

			echo "$class - $ref\n";

			$objects[$class][$ref] = $snapshot;
		}

		isset($objects['pool'])
			and $this->updateXenPools($objects['pool']);
		isset($objects['host'])
			and $this->updateXenHosts($objects['host']);
		isset($objects['vm'])
			and $this->updateXenVms($objects['vm']);

		// Requeue this request.
		return true;
	}

	/**
	 *
	 */
	function updateXenPools(array $pools)
	{
		foreach ($pools as $ref => $pool)
		{
			$this->_update($this->_xenPools[$ref], $pool);
		}
	}

	/**
	 *
	 */
	function updateXenHosts(array $hosts)
	{
		foreach ($hosts as $ref => $host)
		{
			$this->_update($this->_xenHosts[$ref], $host);
		}
	}

	/**
	 *
	 */
	function updateXenVms(array $vms)
	{
		foreach ($vms as $ref => $vm)
		{
			if ($vm['is_a_template'])
			{
				$_ = 'template';
			}
			elseif ($vm['is_a_snapshot'])
			{
				$_ = 'snapshot';
			}
			elseif ($vm['is_control_domain'])
			{
				$_ = 'control_domain';
			}
			else
			{
				$_ = 'normal';
			}

			$this->_update(
				$this->_xenVms[$_][$ref],
				$vm
			);
		}
	}

	/**
	 *
	 */
	function run()
	{
		$this->_loadDatabase();

		//--------------------------------------

		$config = $this->_di->get('config');
		$loop   = $this->_di->get('loop');

		//--------------------------------------

		// Creates master sockets.
		foreach ($config['listen'] as $uri)
		{
			$handle = self::_createServer($uri);
			$loop->addRead($handle, array($this, 'handleServer'));
		}

		//--------------------------------------

		foreach ($config['xcp'] as $_)
		{
			$xcp = new XCP($loop, $_['url'], $_['username'], $_['password']);
			$xcp->queue(
				'VM.get_all_records',
				null,
				array($this, 'updateXenVms')
			);
			$xcp->queue(
				'event.register',
				array(array('host', 'pool', 'vm'))
			);
			$xcp->queue(
				'event.next',
				null,
				array($this, 'handleXenEvents')
			);
		}

		//--------------------------------------

		$loop->run(array(
			'loop'   => $loop,
			'server' => $this
		));
	}

	/**
	 *
	 */
	private static function _createServer($uri)
	{
		list($transport, $target) = explode('://', $uri, 2);

		if (($transport === 'unix')
		    || ($transport === 'udg'))
		{
			@unlink($target);
		}

		$handle = @stream_socket_server(
			$uri,
			/* out */ $errno,
			/* out */ $errstr
		);

		if (!$handle)
		{
			trigger_error(
				"could not create the server socket $uri: $errno - $errstr",
				E_USER_ERROR
			);
		}

		return $handle;
	}

	/**
	 * Dependency injector.
	 *
	 * @var DI
	 */
	private $_di;

	/**
	 * Mapping from user identifier to record.
	 *
	 * Each record contains:
	 * - “name” (string): the user name used for sign in;
	 * - “password” (string): the user password hashed for sign in.
	 *
	 * @var array
	 */
	private $_users = array();

	/**
	 * Mapping from user name to identifier.
	 *
	 * @var array
	 */
	private $_usersByName = array();

	/**
	 * Tokens that may be used to authenticate clients.
	 *
	 * Each token record is an array containing:
	 * - “expiration” (integer): timestamp of when this token will be
	 *   considered invalid;
	 * - “uid” (string): the identifier of the user authenticated with
	 *   this token.
	 *
	 * @var array
	 */
	private $_tokens = array();

	/**
	 * @var array
	 */
	private $_xenPools = array();

	/**
	 * @var array
	 */
	private $_xenHosts = array();

	/**
	 * @var array
	 */
	private $_xenVms = array();

	/**
	 *
	 */
	private static function _tS($val)
	{
		if (is_scalar($val))
		{
			return (string) $val;
		}
		return gettype($val);
	}

	/**
	 *
	 */
	private static function _permissionFromString($string)
	{
		$permissions = array(
			'none'  => self::NONE,
			'read'  => self::READ,
			'write' => self::WRITE,
			'admin' => self::ADMIN
		);

		return isset($permissions[$string])
			? $permissions[$string]
			: false;
	}

	/**
	 *
	 */
	private static function _permissionToString($permission)
	{
		$permissions = array(
			self::NONE  => 'none',
			self::READ  => 'read',
			self::WRITE => 'write',
			self::ADMIN => 'admin',
		);

		return isset($permissions[$permission])
			? $permissions[$permission]
			: false;
	}

	/**
	 *
	 */
	private function _update(&$old, $new)
	{
		// There was no previous record.
		if ($old === null)
		{
			echo "new record\n";
			$old = $new;

			return;
		}

		// The record has been deleted.
		if ($new === null)
		{
			echo "record deleted\n";
			$old = null;

			return;
		}

		$old_keys = array_keys($old);
		$new_keys = array_keys($new);

		foreach (array_diff($old_keys, $new_keys) as $key)
		{
			$_ = self::_tS($old[$key]);
			echo "field removed: $key => $_\n";
		}
		foreach (array_diff($new_keys, $old_keys) as $key)
		{
			$_ = self::_tS($new[$key]);
			echo "field added: $key => $_\n";
		}
		foreach (array_intersect($new_keys, $old_keys) as $key)
		{
			if ($new[$key] === $old[$key])
			{
				continue;
			}

			$_1 = self::_tS($old[$key]);
			$_2 = self::_tS($new[$key]);
			echo "field changed: $key => $_1 → $_2\n";
		}
		$old = $new;
	}

	/**
	 *
	 */
	private function _saveDatabase()
	{
		$data = json_encode(array(
			'users' => $this->_users,
			'usersByName' => $this->_usersByName,
			'tokens'      => $this->_tokens,
		));

		$bytes = @file_put_contents(
			$this->_di->get('config')['database.json'],
			$data
		);
		if ($bytes === false)
		{
			trigger_error(
				'could not write the database',
				E_USER_ERROR
			);
		}
	}

	/**
	 *
	 */
	private function _loadDatabase()
	{
		$file = $this->_di->get('config')['database.json'];
		if (!file_exists($file))
		{
			trigger_error(
				'no such database, using default values (admin:admin)',
				E_USER_WARNING
			);

			// @todo Factorizes this code with api_user_create().

			$this->_users = array(
				1 => array(
					'name'       => 'admin',
					'password'   => '$2y$10$VzBQqiwnhG5zc2.MQmmW4ORcPW6FE7SLhPr1VBV2ubn5zJoesnmli',
					'permission' => self::ADMIN,
				),
			);
			$this->_usersByName = array(
				'admin' => '1',
			);

			return;
		}

		$data = @file_get_contents(
			$this->_di->get('config')['database.json']
		);
		if (($data === false)
		    || (($data = json_decode($data, true)) === null))
		{
			trigger_error(
				'could not read the database',
				E_USER_ERROR
			);
		}

		foreach (array('users', 'usersByName', 'tokens') as $entry)
		{
			if (!isset($data[$entry]))
			{
				trigger_error(
					"missing entry from the database: $entry",
					E_USER_ERROR
				);
			}

			$this->{'_'.$entry} = $data[$entry];
		}
	}

	/**
	 *
	 */
	private function _checkPermission($uid, $permission, $object = null)
	{
		return ($this->_users[$uid]['permission'] >= $permission);
	}
}
