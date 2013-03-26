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

namespace Bean;

/**
 *
 */
final class Host extends BeanAbstract
{
	protected static $_fields;
}
Host::init(array(
	'id',
	'uuid',

	'API_version_major',
	'API_version_minor',
	'API_version_vendor',
	'API_version_vendor_implementation' => true,
	'PBDs' => true,
	'PCIs' => true,
	'PGPUs' => true,
	'PIFs' => true,
	'address',
	'allowed_operations' => true,
	'bios_strings' => true,
	'blobs' => true,
	'capabilities' => true,
	'chipset_info' => true,
	'cpu_configuration' => true,
	'cpu_info' => true,
	'crash_dump_sr',
	'crashdumps' => true,
	'current_operations' => true,
	'edition',
	'enabled',
	'external_auth_configuration' => true,
	'external_auth_service_name',
	'external_auth_type',
	'ha_network_peers' => true,
	'ha_statefiles' => true,
	'host_CPUs' => true,
	'hostname',
	'license_params' => true,
	'license_server' => true,
	'local_cache_sr',
	'logging' => true,
	'memory_overhead',
	'metrics',
	'name_description',
	'name_label',
	'other_config' => true,
	'patches' => true,
	'power_on_config' => true,
	'power_on_mode',
	'resident_VMs' => true,
	'sched_policy',
	'software_version' => true,
	'supported_bootloaders' => true,
	'suspend_image_sr',
	'tags' => true,
));
