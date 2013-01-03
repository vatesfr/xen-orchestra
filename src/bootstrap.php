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
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

/**
 * Bootstraps and returns the application singleton.
 *
 * @return Application
 */
function _bootstrap()
{
	static $application;

	if (!isset($application))
	{
		// Variables definition.
		$root_dir = defined('__DIR__')
			? __DIR__
			: dirname(__FILE__)
			;
		if (defined('APPLICATION_ENV'))
		{
			$app_env = APPLICATION_ENV;
		}
		elseif (($app_env = getenv('APPLICATION_ENV')) === false)
		{
			$app_env = 'development';
		}

		// Class autoloading is done by composer.
		require($root_dir.'/../vendor/autoload.php');

		// Reads configuration.
		$conffile = $root_dir.'/config/'.$app_env.'.php';
		$config   = new Config(require($conffile));

		// Injects some variables.
		$config->set('root_dir', $root_dir);
		$config->set('application_env', $app_env);

		// Dependency injector.
		$di = new DI;
		$di->set('config', $config);

		// Logs all errors.
		$error_logger = $di->get('error_logger');
		set_error_handler(array($error_logger, 'log'));
		register_shutdown_function(array($error_logger, 'handleShutdown'));

		// Finally, creates the application.
		$application = $di->get('application');
	}

	return $application;
}

return _bootstrap();
