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
final class VMs extends ControllerAbstract
{
	/**
	 *
	 */
	function indexAction()
	{
		$vms = $this->_sl->get('xo')->vm->getAll();

		// Groups VMs by hosts.
		$by_hosts = array();
		foreach ($vms as $vm)
		{
			// Backbone requires primary key to be called “id”.
			$vm['id'] = $vm['uuid']; unset($vm['uuid']);

			// Makes sure the null host is recognized and sorted at the end.
			$host_uuid = $vm['host_uuid'] ?: 'z';

			$by_hosts[$host_uuid][] = $vm;
		}

		$hosts = array();
		foreach ($by_hosts as $host_uuid => $vms)
		{
			$hosts[] = array(
				'id'   => $host_uuid,
				'name' => $vms[0]['host_name'],
				'vms'  => $vms,
			);
		}

		// If there is the “json” parameter, just print the JSON.
		if (isset($_GET['json']))
		{
			echo json_encode($hosts);
			return;
		}

		return array(
			'hosts'  => $hosts,
		);
	}

	function showAction(array $route_params)
	{
		$vm = $this->_sl->get('xo')->vm->get($route_params['uuid']);

		// Backbone requires primary key to be called “id”.
		$vm['id'] = $vm['uuid']; unset($vm['uuid']);

		// If there is the “json” parameter, just print the JSON.
		if (isset($_GET['json']))
		{
			echo json_encode($vm);
			return;
		}

		return array(
			'vm'  => $vm,
		);
	}
}
