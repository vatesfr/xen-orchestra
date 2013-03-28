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
final class Templates extends ControllerAbstract
{
	/**
	 *
	 */
	function indexAction()
	{
		$tpls = $this->_sl->get('xo')->template->getAll();

		// Groups VMs by pools.
		$by_pools = array();
		foreach ($tpls as $tpl)
		{
			// Backbone requires primary key to be called “id”.
			$tpl['id'] = $tpl['uuid']; unset($tpl['uuid']);

			// Makes sure the null pool is recognized and sorted at the end.
			$pool_uuid = $tpl['pool_uuid'] ?: 'z';

			$by_pools[$pool_uuid][] = $tpl;
		}

		$pools = array();
		foreach ($by_pools as $pool_uuid => $tpls)
		{
			$pools[] = array(
				'id'        => $pool_uuid,
				'name'      => $tpls[0]['pool_name'],
				'templates' => $tpls,
			);
		}

		// If there is the “json” parameter, just print the JSON.
		if (isset($_GET['json']))
		{
			echo json_encode($pools);
			return;
		}

		return array(
			'pools'  => $pools,
		);
	}
}
