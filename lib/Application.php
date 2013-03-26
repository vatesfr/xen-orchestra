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

use Bean\User;

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

		$users = $this->_di->get('users');

		// Checks the user exists.
		$user = $users->first(array('name' => $name), false);
		if (!$user)
		{
			return array(1, 'invalid credential');
		}

		// Checks the password matches.
		if (!password_verify($password, $user->password))
		{
			return array(1, 'invalid credential');
		}

		// Checks whether the hash needs to be updated.
		if (password_needs_rehash($user->password, PASSWORD_DEFAULT))
		{
			$user->password = password_hash($password, PASSWORD_DEFAULT);
			$users->save($user);
		}

		// Marks the client as authenticated.
		$c->uid = $user->id;

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

		$tokens = $this->_di->get('tokens');

		// Checks the token exists.
		$token = $tokens->first($token, false);
		if (!$token)
		{
			return array(1, 'invalid token');
		}

		// Checks the token is valid.
		if ($token->expiration < time())
		{
			$tokens->delete($token->id);
			return array(1, 'invalid token');
		}

		// Marks the client as authenticated.
		$c->uid = $token->user_id;

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

		$user = $this->_di->get('users')->first($c->uid);

		$c->respond($id, array(
			'id'         => $user->id,
			'name'       => $user->name,
			'permission' => $user->permission,
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

		$tokens = $this->_di->get('tokens');

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
		} while ($tokens->exists($token));

		// Registers it.
		$tokens->create(array(
			'id'         => $token,
			'expiration' => time() + 604800, // One week
			'user_id'    => $c->uid,
		));

		// Returns it.
		$c->respond($id, $token);
	}

	/**
	 *
	 */
	function api_session_destroyToken($id, array $params, Client $c)
	{
		// Checks parameters.
		if (!isset($params[0]))
		{
			return -32602; // Invalid params.
		}
		$token_id = $params[0];

		$tokens = $this->_di->get('tokens');

		// Checks the token exists.
		if (!$tokens->exists($token_id))
		{
			return array(0, 'invalid token');
		}

		// Deletes it.
		$tokens->delete($token_id);

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
		    || !$this->_checkPermission($c->uid, User::ADMIN))
		{
			return array(0, 'not authorized');
		}

		// Checks the provided user name.
		if (!User::check('name', $name))
		{
			return array(1, 'invalid user name');
		}

		// Checks the provided password.
		if (!User::check('password', $password))
		{
			return array(2, 'invalid password');
		}

		// Checks provided permission.
		if (isset($params[2]))
		{
			$permission = $params[2];
			if (!User::check('permission', $permission))
			{
				return array(3, 'invalid permission');
			}
		}
		else
		{
			$permission = User::NONE;
		}

		$users = $this->_di->get('users');

		// Checks if the user name is already used.
		if ($users->exists(array('name' => $name)))
		{
			return array(4, 'user name already taken');
		}

		// Creates the user.
		$user = $users->create(array(
			'name'       => $name,
			'password'   => $password,
			'permission' => $permission,
		));

		// Returns the identifier.
		$c->respond($id, $user->id);
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
		    || !$this->_checkPermission($c->uid, User::ADMIN))
		{
			return array(0, 'not authorized');
		}

		$users = $this->_di->get('users');

		// Checks user exists and is not the current user.
		if (($uid === $c->uid)
			|| !$users->exists($uid))
		{
			return array(1, 'invalid user');
		}

		// Deletes the user.
		$users->delete($uid);

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

		$users = $this->_di->get('users');
		$user  = $users->first($c->uid);

		// Checks the old password matches.
		if (!password_verify($old, $user->password))
		{
			return array(1, 'invalid credential');
		}

		// Checks the new password is valid.
		if (($new === $old)
			|| !$user->checkAndSet('password', $new))
		{
			return array(2, 'invalid password');
		}

		$users->save($user);

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
		    || !$this->_checkPermission($c->uid, User::ADMIN))
		{
			return array(0, 'not authorized');
		}

		$users = $this->_di->get('users')->getArray(
			null,
			array('id', 'name', 'permission')
		);
		foreach ($users as &$user)
		{
			$user['permission'] = User::permissionToString($user['permission']);
		}

		$c->respond($id, $users);
	}

	/**
	 *
	 */
	function api_user_set($id, array $params, Client $c)
	{
		// Checks parameter.
		if (!isset($params[0], $params[1]))
		{
			return -32602; // Invalid params.
		}
		list($uid, $properties) = $params;

		if (!$c->isAuthenticated()
		    || !$this->_checkPermission($c->uid, User::ADMIN))
		{
			return array(0, 'not authorized');
		}

		$users = $this->_di->get('users');

		// Checks user exists and is not the current user.
		if (($uid === $c->uid)
			|| !($user = $users->first($uid, false)))
		{
			return array(1, 'invalid user');
		}

		foreach ($properties as $field => $value)
		{
			if ('name' === $field)
			{
				if (!$user->checkAndSet('name', $value))
				{
					return array(3, 'invalid user name');
				}
			}
			elseif ('password' === $field)
			{
				if (!$user->checkAndSet('password', $value))
				{
					return array(4, 'invalid password');
				}
			}
			elseif ('permission' === $field)
			{
				if (!$user->checkAndSet('permission', $value))
				{
					return array(5, 'invalid permission '.$value);
				}
			}
			else
			{
				return array(2, 'invalid property');
			}
		}
		$users->save($user);

		$c->respond($id, true);
	}

	/**
	 *
	 */
	function api_vm_getAll($id, array $params, Client $c)
	{
		// @todo Handles parameter.

		$c->respond($id, $this->_di->get('vms')->getArray());
	}

	/**
	 *
	 */
	function api_xo_getStats($id, array $params, Client $c)
	{
		$mgr_vms     = $this->_di->get('vms');
		$mgr_metrics = $this->_di->get('vms_metrics');

		$memory  = 0;
		$n_vcpus = 0;
		$n_vifs  = 0;

		$running_vms = $mgr_vms->get(array(
			'power_state'       => 'Running',
			'is_control_domain' => false,
		));
		foreach ($running_vms as $vm)
		{
			$metrics = $mgr_metrics->first($vm->metrics);

			$memory += $metrics->memory_actual;
			$n_vcpus  += $metrics->VCPUs_number;
			$n_vifs   += count($vm->VIFs);
		}

		// @todo Replace with inequality filter when Rekodi implements it.
		$srs = $this->_di->get('srs')->getArray(array(
			'shared' => true,
		));
		$n_srs = 0;
		foreach ($srs as $sr)
		{
			if (-1 != $sr['physical_size'])
			{
				++$n_srs;
			}
		}

		/**
		 * - Nombre de serveurs connectés.
		 * - Nombre de running VMs.
		 * - Total RAM/CPUs allouées aux running VMS.
		 * - Nombre de SR.
		 * - Nombre de VMs (ni templates ni snapshots).
		 */
		$stats = array(
			'hosts'       => $mgr_vms->count(array(
				'is_control_domain' => true,
			)),
			'vms'         => $mgr_vms->count(array(
				'is_a_snapshot'     => false,
				'is_a_template'     => false,
				'is_control_domain' => false,
			)),
			'running_vms' => count($running_vms),
			'memory'      => $memory,
			'vcpus'       => $n_vcpus,
			'vifs'        => $n_vifs,
			'srs'         => $n_srs,
		);

		$c->respond($id, $stats);
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
			$class    = $event['class'];
			$ref      = $event['ref'];
			$snapshot = $event['snapshot']; // Not present in the documentation.

			$objects[$class][$ref] = $snapshot;

			echo "Event: $class ($ref)\n";
		}

		isset($objects['message'])
			and $this->_di->get('messages')->batchImport($objects['message']);
		isset($objects['pool'])
			and $this->_di->get('pools')->batchImport($objects['pool']);
		isset($objects['sr'])
			and $this->_di->get('srs')->batchImport($objects['sr']);
		isset($objects['vif'])
			and $this->_di->get('vifs')->batchImport($objects['vifs']);
		isset($objects['vm'])
			and $this->_di->get('vms')->batchImport($objects['vm']);
		isset($objects['vm_guest_metrics'])
			and $this->_di->get('vms_guest_metrics')->batchImport($objects['vm_guest_metrics']);
		isset($objects['vm_metrics'])
			and $this->_di->get('vms_metrics')->batchImport($objects['vm_metrics']);

		// Requeue this request.
		return true;
	}

	/**
	 *
	 */
	function run()
	{
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

		// map(XCP class: manager)
		$classes = array(
			'message'          => 'messages',
			'pool'             => 'pools',
			'SR'               => 'srs',
			'VIF'              => 'vifs',
			'VM'               => 'vms',
			'VM_guest_metrics' => 'vms_guest_metrics',
			'VM_metrics'       => 'vms_metrics',
		);

		foreach ($config['xcp'] as $_)
		{
			$xcp = new XCP($loop, $_['url'], $_['username'], $_['password']);

			foreach ($classes as $class => $manager)
			{
				$xcp->queue(
					$class.'.get_all_records',
					null,
					array($this->_di->get($manager), 'batchImport')
				);
			}

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
	 * @var array
	 */
	private $_xenPools = array();

	/**
	 * @var array
	 */
	private $_xenHosts = array();

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
	private function _checkPermission($uid, $permission, $object = null)
	{
		$user = $this->_di->get('users')->first($uid);

		return ($user->permission >= $permission);
	}
}
