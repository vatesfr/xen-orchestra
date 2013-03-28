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
final class VDI extends BeanAbstract
{
	protected static $_fields;
}
VDI::init(array(
	'id',
	'uuid',

	'SR',
	'VBDs' => true,
	'allow_caching',
	'allowed_operations' => true,
	'crash_dumps' => true,
	'current_operations' => true,
	'is_a_snapshot',
	'location',
	'managed',
	'metadata_latest',
	'metadata_of_pool',
	'missing',
	'name_description',
	'name_label',
	'on_boot',
	'other_config' => true,
	'parent',
	'physical_utilisation',
	'read_only',
	'sharable',
	'sm_config' => true,
	'snapshot_of',
	'snapshot_time' => true,
	'snapshots' => true,
	'storage_lock',
	'tags' => true,
	'type',
	'virtual_size',
	'xenstore_data' => true,
));
