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
final class VMs extends \Controller
{
	/**
	 *
	 */
	function indexAction()
	{
		$vms = $this->_sl->get('xo')->vm->getAll();

		$hosts = array();

		$keys = array(
			'name_label',
			'name_description',
			'power_state',
		);
		foreach ($vms as $vm)
		{
			$_ = array();
			foreach ($keys as $key)
			{
				$_[$key] = $vm[$key];
			}
			$hosts[$vm['resident_on']][] = $_;
		}

		ksort($hosts);

		return array(
			'columns' => $keys,
			'vms'     => $hosts,
		);
	}

	function dynamicAction()
	{
		$vms = $this->_sl->get('xo')->vm->getAll();

		// Selects only this fields.
		$fields = array_flip(array(
			'id',
			'name_label',
			'name_description',
			'power_state',
		));

		// Groups VMs by hosts.
		$by_hosts = array();
		foreach ($vms as $vm)
		{
			$by_hosts[$vm['resident_on']][] = array_intersect_key(
				$vm,
				$fields
			);
		}

		$hosts = array();
		foreach ($by_hosts as $host => $vms)
		{
			$hosts[] = array(
				'id'  => $host,
				'vms' => $vms,
			);
		}

		// If there is the “json” parameter, just print the JSON.
		if (isset($_GET['json']))
		{
			echo json_encode($hosts);
			return;
		}

		return array(
			'fields' => array_flip($fields),
			'hosts'  => $hosts,
		);
	}
}
