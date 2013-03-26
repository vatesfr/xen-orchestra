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
final class Pool extends BeanAbstract
{
	protected static $_fields;
}
Pool::init(array(
	'id',
	'uuid',

	'blobs' => true,
	'crash_dump_SR',
	'default_SR',
	'gui_config' => true,
	'ha_allow_overcommit',
	'ha_configuration' => true,
	'ha_enabled',
	'ha_host_failures_to_tolerate',
	'ha_overcommitted',
	'ha_plan_exists_for',
	'ha_statefiles' => true,
	'master',
	'metadata_VDIs' => true,
	'name_description',
	'name_label',
	'other_config' => true,
	'redo_log_enabled',
	'redo_log_vdi',
	'restrictions' => true,
	'suspend_image_SR',
	'tags' => true,
	'uuid',
	'vswitch_controller',
	'wlb_enabled',
	'wlb_url',
	'wlb_username',
	'wlb_verify_cert',
));
