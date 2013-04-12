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
	 * @todo Sort by pool.
	 */
	function api_network_getAll($id, array $params, Client $c)
	{
		$di = $this->_di;

		$mgr_pifs         = $di->get('pifs');
		$mgr_pifs_metrics = $di->get('pifs_metrics');

		$PIFs = array();
		foreach ($mgr_pifs->get() as $i => $PIF)
		{
			$PIF_metrics = $mgr_pifs_metrics->first($PIF->metrics);

			$PIFs[] = array(
				'currently_attached' => $PIF->currently_attached,
				'device'             => $PIF_metrics->device_name,
				'duplex'             => $PIF_metrics->duplex,
				'IP'                 => $PIF->IP,
				'MAC'                => $PIF->MAC,
				'name'               => 'PIF #'.$i, // @todo
				'speed'              => $PIF_metrics->speed,
				'uuid'               => $PIF->uuid,
				'vendor'             => $PIF_metrics->vendor_name,
			);
		}

		$pools = array(
			array(
				'uuid' => 'unknown',
				'name' => 'unknown pool',
				'PIFs'  => $PIFs,
			),
		);

		$c->respond($id, $pools);
	}

	/**
	 * @todo Sort by pool.
	 */
	function api_storage_getAll($id, array $params, Client $c)
	{
		$di = $this->_di;

		$mgr_srs = $di->get('srs');

		$SRs = array();
		foreach ($mgr_srs->get() as $SR)
		{
			$SRs[] = array(
				'allocated'   => $SR->virtual_allocation,
				'description' => $SR->name_description,
				'name'        => $SR->name_label,
				'shared'      => $SR->shared,
				'total'       => $SR->physical_size,
				'type'        => $SR->type,
				'used'        => $SR->physical_utilisation,
			);
		}

		$pools = array(
			array(
				'uuid' => 'unknown',
				'name' => 'unknown pool',
				'SRs'  => $SRs,
			),
		);

		$c->respond($id, $pools);
	}

	/**
	 * @todo Sort by pool.
	 */
	function api_host_getAll($id, array $params, Client $c)
	{
		$di = $this->_di;

		$mgr_hosts         = $di->get('hosts');
		$mgr_hosts_metrics = $di->get('hosts_metrics');
		$mgr_pifs          = $di->get('pifs');
		$mgr_vms           = $di->get('vms');
		$mgr_vms_metrics   = $di->get('vms_metrics');

		$hosts = array();
		foreach ($mgr_hosts->get() as $host)
		{
			$dom0 = $mgr_vms->first(array(
				'resident_on'       => $host->id,
				'is_control_domain' => true,
			));
			$dom0_metrics = $mgr_vms_metrics->first($dom0->metrics);

			$IPs = array();
			foreach ($host->PIFs as $PIF_ref)
			{
				$PIF = $mgr_pifs->first($PIF_ref);

				$IPs[] = $PIF->IP;
			}

			$host_metrics = $mgr_hosts_metrics->first($host->metrics);
			$memory = array(
				'free'  => $host_metrics->memory_free,
				'total' => $host_metrics->memory_total,
			);

			$hosts[] = array(
				'description' => $host->name_description,
				'id'          => $host->uuid,
				'IPs'         => $IPs,
				'memory'      => $memory,
				'name'        => $host->name_label,
				'start_time'  => $dom0_metrics->start_time['timestamp'],
			);
		}

		$pools = array(
			array(
				'uuid'  => 'unknown',
				'name'  => 'unknown pool',
				'hosts' => $hosts,
			),
		);

		$c->respond($id, $pools);
	}

	/**
	 *
	 */
	function api_host_get($id, array $params, Client $c)
	{
		// Checks parameter.
		if (!isset($params[0]))
		{
			return -32602; // Invalid params.
		}

		$di = $this->_di;

		$mgr_guest_metrics = $di->get('vms_guest_metrics');
		$mgr_hosts         = $di->get('hosts');
		$mgr_hosts_metrics = $di->get('hosts_metrics');
		$mgr_hosts_cpu     = $di->get('hosts_cpus');
		$mgr_pbds          = $di->get('pbds');
		$mgr_pifs          = $di->get('pifs');
		$mgr_pifs_metrics  = $di->get('pifs_metrics');
		$mgr_vms           = $di->get('vms');
		$mgr_vms_metrics   = $di->get('vms_metrics');
		$mgr_srs           = $di->get('srs');

		$host    = $mgr_hosts->first(array(
			'uuid' => $params[0],
		));
		$metrics = $mgr_hosts_metrics->first($host->metrics);

		// $mgr_messages      = $di->get('messages');
		// $mgr_networks      = $di->get('networks');
		// $mgr_vbds          = $di->get('vbds');
		// $mgr_vdis          = $di->get('vdis');
		// $mgr_vifs          = $di->get('vifs');

		$dom0 = $mgr_vms->first(array(
			'resident_on'       => $host->id,
			'is_control_domain' => true,
		));
		$dom0_metrics       = $mgr_vms_metrics->first($dom0->metrics);
		$dom0_guest_metrics = $mgr_guest_metrics->first($dom0->guest_metrics, false);

		$vms = $mgr_vms->get(array(
			'resident_on' => $host->id,
		));

		$CPUs = array();
		foreach ($mgr_hosts_cpu->get(array('host' => $host->id)) as $CPU)
		{
			$CPUs = array(
				'model'      => $CPU->model,
				'model_name' => $CPU->modelname,
				'number'     => $CPU->number,
				'speed'      => $CPU->speed,
				'vendor'     => $CPU->vendor,
			);
		}

		$memory = array(
			'free'   => $metrics->memory_free,
			'total'  => $metrics->memory_total,
			'per_VM' => array(),
		);

		$os_version = $dom0_guest_metrics
			? $dom0->guest_metrics->os_version
			: null;

		$PIFs = array();
		foreach ($mgr_pifs->get(array('host' => $host->id)) as $i => $PIF)
		{
			$PIF_metrics = $mgr_pifs_metrics->first($PIF->metrics);

			$PIFs[] = array(
				'currently_attached' => $PIF->currently_attached,
				'device'             => $PIF_metrics->device_name,
				'duplex'             => $PIF_metrics->duplex,
				'IP'                 => $PIF->IP,
				'MAC'                => $PIF->MAC,
				'name'               => 'PIF #'.$i, // @todo
				'speed'              => $PIF_metrics->speed,
				'uuid'               => $PIF->uuid,
				'vendor'             => $PIF_metrics->vendor_name,
			);
		}

		$SRs = array();
		foreach ($mgr_pbds->get(array('host' => $host->id)) as $PBD)
		{
			$SR = $mgr_srs->first($PBD->SR);
			$SRs[] = array(
				'allocated'   => $SR->virtual_allocation,
				'description' => $SR->name_description,
				'name'        => $SR->name_label,
				'shared'      => $SR->shared,
				'total'       => $SR->physical_size,
				'type'        => $SR->type,
				'used'        => $SR->physical_utilisation,
			);
		}

		$VMs = array();
		foreach ($vms as $VM)
		{
			$VMs[$VM->uuid] = array(
				'is_control_domain' => $VM->is_control_domain,
				'name'              => $VM->name_label,
			);
			$memory['per_VM'][$VM->uuid] = $VM->memory_dynamic_max;
		}

		$host = array(
			'CPUs'                  => $CPUs,
			'control_domain'        => $dom0->uuid,
			'description'           => $host->name_description,
			'enabled'               => $host->enabled,
			'hostname'              => $host->hostname,
			'is_pool_master'        => false, // @todo
			'iscsi_iqn'             => null, //@todo,
			'log_destination'       => 'local', // @todo
			'memory'                => $memory,
			'name'                  => $host->name_label,
			'os_version'            => $os_version,
			'PIFs'                  => $PIFs,
			'SRs'                   => $SRs,
			'start_time'            => $dom0_metrics->start_time['timestamp'],
			'tool_stack_start_time' => $dom0_metrics->start_time['timestamp'], // @todo
			'uuid'                  => $host->uuid,
			'software_version'      => $host->software_version,
			'VMs'                   => $VMs,
		);

		$c->respond($id, $host);
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
	function api_template_get($id, array $params, Client $c)
	{
		// Checks parameter.
		if (!isset($params[0]))
		{
			return -32602; // Invalid params.
		}

		$di      = $this->_di;
		$mgr_vms = $di->get('vms');

		$vm = $mgr_vms->first(array(
			'uuid'          => $params[0],
			'is_a_template' => true,
		), false);
		if (!$vm)
		{
			return array(0, 'invalid VM reference');
		}

		$mgr_guest_metrics = $di->get('vms_guest_metrics');
		$mgr_hosts         = $di->get('hosts');
		$mgr_messages      = $di->get('messages');
		$mgr_metrics       = $di->get('vms_metrics');
		$mgr_networks      = $di->get('networks');
		$mgr_vbds          = $di->get('vbds');
		$mgr_vdis          = $di->get('vdis');
		$mgr_vifs          = $di->get('vifs');
		$mgr_srs           = $di->get('srs');

		$guest_metrics = $mgr_guest_metrics->first($vm->guest_metrics, false);
		$host          = $mgr_hosts->first($vm->resident_on, false);
		$metrics       = $mgr_metrics->first($vm->metrics);

		if ($guest_metrics && ($_ = $guest_metrics->memory))
		{
			$used_memory  = $_['used'];
			$total_memory = $_['total'];
		}
		else
		{
			$used_memory  = null;
			$total_memory = $metrics->memory_actual;
		}

		$messages = array();
		foreach ($mgr_messages->get(array('obj_uuid' => $vm->uuid)) as $message)
		{
			$messages[] = array(
				'body'    => $message->body,
				'subject' => $message->name,
				'time'    => $message->timestamp['timestamp'],
			);
		}

		$networks = $guest_metrics
			? $guest_metrics->networks
			: null;

		$os_version = $guest_metrics
			? $guest_metrics->os_version
			: null;

		$preferred_host = ('OpaqueRef:NULL' !== $vm->affinity)
			? $vm->affinity
			: null;

		$snapshots = array();
		foreach ($vm->snapshots as $snapshot_ref)
		{
			$snapshot = $mgr_vms->first($snapshot_ref);
			$origin   = $mgr_vms->first($snapshot->snapshot_of);

			$snapshots[] = array(
				'name'        => $snapshot->name_label,
				'origin_name' => $origin->name_label,
				'origin_uuid' => $origin->uuid,
				'time'        => $snapshot->snapshot_time['timestamp'],
				'uuid'        => $snapshot->uuid,
				'uuid'        => $snapshot->uuid,
			);
		}

		$start_time = (0 === $metrics->start_time['timestamp'])
			? null
			: $metrics->start_time['timestamp'];

		$vbds = array();
		foreach ($vm->VBDs as $vbd_ref)
		{
			$vbd = $mgr_vbds->first($vbd_ref);

			if ($vbd->empty)
			{
				continue;
			}

			$vdi = $mgr_vdis->first($vbd->VDI);
			$sr  = $mgr_srs->first($vdi->SR);

			$vbds[] = array(
				'currently_attached' => $vbd->currently_attached,
				'description'        => $vdi->name_description,
				'name'               => $vbd->userdevice,
				'path'               => '<i>unknown</i>', //@todo
				'priority'           => '<i>unknown</i>', //@todo
				'read_only'          => $vdi->read_only,
				'size'               => $vdi->virtual_size,
				'SR_name'            => $sr->name_label,
				'SR_uuid'            => $sr->uuid,
				'uuid'               => $vbd->uuid,
			);
		}

		$vifs = array();
		foreach ($vm->VIFs as $vif_ref)
		{
			$vif     = $mgr_vifs->first($vif_ref);
			$network = $mgr_networks->first($vif->network);

			$vifs[] = array(
				'currently_attached' => $vif->currently_attached,
				'ip'                 => $networks ? array_pop($networks) : null, // @todo
				'MAC'                => $vif->MAC,
				'network_name'       => $network->name_label,
				'network_uuid'       => $network->uuid,
				'uuid'               => $vif->uuid,
			);
		}

		$entry = array(
			'bios'                  => $vm->bios_strings,
			'description'           => $vm->name_description,
			'HVM_boot_params'       => $vm->HVM_boot_params,
			'memory_dynamic_max'    => $vm->memory_dynamic_max,
			'memory_dynamic_min'    => $vm->memory_dynamic_min,
			'messages'              => $messages,
			'name'                  => $vm->name_label,
			'networks'              => $networks,
			'os_version'            => $os_version,
			'preferred_host'        => $preferred_host,
			'snapshots'             => $snapshots,
			'tags'                  => $vm->tags,
			'total_memory'          => $total_memory,
			'used_memory'           => $used_memory,
			'uuid'                  => $vm->uuid,
			'VBDs'                  => $vbds,
			'VCPUs_number'          => $metrics->VCPUs_number,
			'VCPUs_utilisation'     => $metrics->VCPUs_utilisation,
			'VIFs'                  => $vifs,
		);

		//var_dump($entry);

		$c->respond($id, $entry);
	}

	/**
	 *
	 */
	function api_template_getAll($id, array $params, Client $c)
	{
		// @todo Handles parameter.
		$di = $this->_di;
		$mgr_vms = $di->get('vms');

		$vms = $mgr_vms->get(array(
			'is_a_template'     => true,
		));

		$tpls = array();
		foreach ($mgr_vms->get(array('is_a_template' => true)) as $tpl)
		{
			$tpls[] = array(
				'description' => $tpl->name_description,
				'name'        => $tpl->name_label,
				'uuid'        => $tpl->uuid,
				'pool_uuid'   => null, // @todo
				'pool_name'   => null,
			);
		}

		$c->respond($id, $tpls);
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
	function api_vm_get($id, array $params, Client $c)
	{
		// Checks parameter.
		if (!isset($params[0]))
		{
			return -32602; // Invalid params.
		}

		$di      = $this->_di;
		$mgr_vms = $di->get('vms');

		$vm = $mgr_vms->first(array('uuid' => $params[0]), false);
		if (!$vm)
		{
			return array(0, 'invalid VM reference');
		}

		$mgr_guest_metrics = $di->get('vms_guest_metrics');
		$mgr_hosts         = $di->get('hosts');
		$mgr_messages      = $di->get('messages');
		$mgr_metrics       = $di->get('vms_metrics');
		$mgr_networks      = $di->get('networks');
		$mgr_vbds          = $di->get('vbds');
		$mgr_vdis          = $di->get('vdis');
		$mgr_vifs          = $di->get('vifs');
		$mgr_srs           = $di->get('srs');

		$guest_metrics = $mgr_guest_metrics->first($vm->guest_metrics, false);
		$host          = $mgr_hosts->first($vm->resident_on, false);
		$metrics       = $mgr_metrics->first($vm->metrics);

		if ($guest_metrics && ($_ = $guest_metrics->memory))
		{
			$used_memory  = $_['used'];
			$total_memory = $_['total'];
		}
		else
		{
			$used_memory  = null;
			$total_memory = $metrics->memory_actual;
		}

		$messages = array();
		foreach ($mgr_messages->get(array('obj_uuid' => $vm->uuid)) as $message)
		{
			$messages[] = array(
				'body'    => $message->body,
				'subject' => $message->name,
				'time'    => $message->timestamp['timestamp'],
			);
		}

		$networks = $guest_metrics
			? $guest_metrics->networks
			: null;

		$os_version = $guest_metrics
			? $guest_metrics->os_version
			: null;

		$preferred_host = ('OpaqueRef:NULL' !== $vm->affinity)
			? $vm->affinity
			: null;

		$pv_drivers_up_to_date = $guest_metrics
			? $guest_metrics->PV_drivers_up_to_date
			: false;

		$snapshots = array();
		foreach ($vm->snapshots as $snapshot_ref)
		{
			$snapshot = $mgr_vms->first($snapshot_ref);
			$origin   = $mgr_vms->first($snapshot->snapshot_of);

			$snapshots[] = array(
				'name'        => $snapshot->name_label,
				'origin_name' => $origin->name_label,
				'origin_uuid' => $origin->uuid,
				'time'        => $snapshot->snapshot_time['timestamp'],
				'uuid'        => $snapshot->uuid,
				'uuid'        => $snapshot->uuid,
			);
		}

		$start_time = (0 === $metrics->start_time['timestamp'])
			? null
			: $metrics->start_time['timestamp'];

		$vbds = array();
		foreach ($vm->VBDs as $vbd_ref)
		{
			$vbd = $mgr_vbds->first($vbd_ref);

			if ($vbd->empty)
			{
				continue;
			}

			$vdi = $mgr_vdis->first($vbd->VDI);
			$sr  = $mgr_srs->first($vdi->SR);

			$vbds[] = array(
				'currently_attached' => $vbd->currently_attached,
				'description'        => $vdi->name_description,
				'name'               => $vbd->userdevice,
				'path'               => '<i>unknown</i>', //@todo
				'priority'           => '<i>unknown</i>', //@todo
				'read_only'          => $vdi->read_only,
				'size'               => $vdi->virtual_size,
				'SR_name'            => $sr->name_label,
				'SR_uuid'            => $sr->uuid,
				'uuid'               => $vbd->uuid,
			);
		}

		$vifs = array();
		foreach ($vm->VIFs as $vif_ref)
		{
			$vif     = $mgr_vifs->first($vif_ref);
			$network = $mgr_networks->first($vif->network);

			$vifs[] = array(
				'currently_attached' => $vif->currently_attached,
				'ip'                 => $networks ? array_pop($networks) : null, // @todo
				'MAC'                => $vif->MAC,
				'network_name'       => $network->name_label,
				'network_uuid'       => $network->uuid,
				'uuid'               => $vif->uuid,
			);
		}

		$entry = array(
			'bios'                  => $vm->bios_strings,
			'description'           => $vm->name_description,
			'host_name'             => $host ? $host->name_label : null,
			'host_uuid'             => $host ? $host->uuid : null,
			'HVM_boot_params'       => $vm->HVM_boot_params,
			'memory_dynamic_max'    => $vm->memory_dynamic_max,
			'memory_dynamic_min'    => $vm->memory_dynamic_min,
			'messages'              => $messages,
			'name'                  => $vm->name_label,
			'networks'              => $networks,
			'os_version'            => $os_version,
			'power_state'           => $vm->power_state,
			'preferred_host'        => $preferred_host,
			'PV_drivers_up_to_date' => $pv_drivers_up_to_date,
			'snapshots'             => $snapshots,
			'start_time'            => $start_time,
			'tags'                  => $vm->tags,
			'total_memory'          => $total_memory,
			'used_memory'           => $used_memory,
			'uuid'                  => $vm->uuid,
			'VBDs'                  => $vbds,
			'VCPUs_number'          => $metrics->VCPUs_number,
			'VCPUs_utilisation'     => $metrics->VCPUs_utilisation,
			'VIFs'                  => $vifs,
		);

		$c->respond($id, $entry);
	}

	/**
	 *
	 */
	function api_vm_getAll($id, array $params, Client $c)
	{
		// @todo Handles parameter.
		$di = $this->_di;

		$mgr_guest_metrics = $di->get('vms_guest_metrics');
		$mgr_hosts         = $di->get('hosts');
		$mgr_metrics       = $di->get('vms_metrics');
		$mgr_vms           = $di->get('vms');

		$vms = $mgr_vms->get(array(
			'is_a_snapshot'     => false,
			'is_a_template'     => false,
			'is_control_domain' => false,
		));

		$entries = array();
		foreach ($vms as $vm)
		{
			$guest_metrics = $mgr_guest_metrics->first($vm->guest_metrics, false);
			$host          = $mgr_hosts->first($vm->resident_on, false);
			$metrics       = $mgr_metrics->first($vm->metrics);

			if ($guest_metrics && ($_ = $guest_metrics->memory))
			{
				$used_memory  = $_['used'];
				$total_memory = $_['total'];
			}
			else
			{
				$used_memory  = null;
				$total_memory = $metrics->memory_actual;
			}

			$networks = $guest_metrics
				? $guest_metrics->networks
				: null;

			$start_time = (0 === $metrics->start_time['timestamp'])
				? null
				: $metrics->start_time['timestamp'];

			$entries[] = array(
				'host_name'         => $host ? $host->name_label : null,
				'host_uuid'         => $host ? $host->uuid : null,
				'name_description'  => $vm->name_description,
				'name_label'        => $vm->name_label,
				'networks'          => $networks,
				'power_state'       => $vm->power_state,
				'start_time'        => $start_time,
				'total_memory'      => $total_memory,
				'used_memory'       => $used_memory,
				'uuid'              => $vm->uuid,
				'VBDs'              => count($vm->VBDs),
				'VCPUs_utilisation' => $metrics->VCPUs_utilisation,
				'VIFs'              => count($vm->VIFs),
			);

			// var_export(array(
			// 	'vm' => $vm->getProperties(),
			// 	'metrics' => $metrics->getProperties(),
			// 	'guest_metrics' => $guest_metrics->getProperties(),
			// ));
		}

		$c->respond($id, $entries);
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
		// Maps lower-case classes to managers.
		$map = array(
			'host'             => 'hosts',
			'host_cpu'         => 'hosts_cpus',
			'host_metrics'     => 'hosts_metrics',
			'message'          => 'messages',
			'network'          => 'networks',
			'pif'              => 'pifs',
			'pif_metrics'      => 'pifs_metrics',
			'pool'             => 'pools',
			'sr'               => 'srs',
			'vbd'              => 'vbds',
			'vdi'              => 'vdis',
			'vm'               => 'vms',
			'vm_guest_metrics' => 'vms_guest_metrics',
			'vm_metrics'       => 'vm_metrics',
		);

		$objects = array();
		foreach ($events as $event)
		{
			$class    = $event['class'];
			$ref      = $event['ref'];
			$snapshot = $event['snapshot']; // Not present in the documentation.

			echo "Event: $class ($ref)\n";

			if (isset($map[$class]))
			{
				$objects[$class][$ref] = $snapshot;
			}
		}

		foreach ($objects as $class => $batch)
		{
			$this->_di->get($map[$class])->batchImport($batch);
		}

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
			'host'             => 'hosts',
			'host_metrics'     => 'hosts_metrics',
			'message'          => 'messages',
			'network'          => 'networks',
			'PBD'              => 'pbds',
			'PIF'              => 'pifs',
			'PIF_metrics'      => 'pifs_metrics',
			'pool'             => 'pools',
			'SR'               => 'srs',
			'VBD'              => 'vbds',
			'VDI'              => 'vdis',
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
