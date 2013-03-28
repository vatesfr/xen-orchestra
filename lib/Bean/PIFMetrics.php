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
final class PIFMetrics extends BeanAbstract
{
	protected static $_fields;
}
PIFMetrics::init(array(
	'id',
	'uuid',

	'carrier',
	'device_id',
	'device_name',
	'duplex',
	'io_read_kbs',
	'io_write_kbs',
	'last_updated' => true,
	'other_config' => true,
	'pci_bus_path',
	'speed',
	'vendor_id',
	'vendor_name',
));
