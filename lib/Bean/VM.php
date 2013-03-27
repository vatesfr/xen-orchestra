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
final class VM extends BeanAbstract
{
	protected static $_fields;
}
VM::init(array(
	// Identifiers.
	'id',
	'uuid',
	'name_label',
	'resident_on', // The host this VM is currently resident on.
	'domarch', // Domain architecture if available, null otherwise.
	'domid', // Domain ID.

	// Description.
	'name_description',
	'is_a_template',
	'is_a_snapshot',
	'is_control_domain',
	'tags' => true,

	// Technical characteristics.
	'attached_PCIs' => true,
	'bios_strings' => true,
	'HVM_boot_params' => true,
	'platform',
	'VBDs' => true, // Virtual Block Devices.
	'VCPUs_at_startup',
	'VCPUs_max',
	'VCPUs_params' => true,
	'VGPUs' => true,
	'VIFs' => true, // Virtual Network Interface.
	//'VTPMs' => true, // Virtual Trust Platform Modules ???

	// Event-related actions.
	'actions_after_crash',
	'actions_after_reboot',
	'actions_after_shutdown',

	// Current state.
	'guest_metrics',
	'memory_dynamic_max',
	'memory_dynamic_min',
	'memory_overhead',
	'memory_static_max',
	//'memory_static_min', // @deprecated
	'memory_target',
	'metrics',
	'power_state',

	// Snapshot-related info.
	'shutdown_delay',
	'snapshot_info',
	'snapshot_metadata',
	'snapshot_of',
	'snapshot_time',
	'snapshots' => true,
	'transportable_snapshot_id',

	// Operations.
	'allowed_operations' => true,
	'current_operations',

	// Various.
	'consoles' => true,

	// 'affinity',
	// 'appliance',
	// 'blobs',
	// 'blocked_operations',
	// 'children' => true, // ???
	// 'crash_dumps' => true,
	// 'ha_always_run', // @deprecated
	// 'ha_restart_priority',
	// 'HVM_boot_policy',
	// 'HVM_shadow_multiplier',
	// 'is_snapshot_from_vmpp',
	// 'last_boot_CPU_flags',
	// 'last_booted_record',
	// 'order',
	// 'other_config',
	// 'parent', // ???
	// 'PCI_bus', // @deprecated
	// 'protection_policy',
	// 'PV_args',
	// 'PV_bootloader',
	// 'PV_bootloader_args',
	// 'PV_kernel',
	// 'PV_legacy_args',
	// 'PV_ramdisk',
	// 'recommendations',
	// 'start_delay',
	// 'suspend_SR',
	// 'suspend_VDI',
	// 'user_version',
	// 'version',
	// 'xenstore_data',
));
