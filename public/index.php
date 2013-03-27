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
 * @author Olivier Lambert <olivier.lambert@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

/**
 * Bootstraps the application and returns the service locator.
 *
 * @return ServiceLocator
 */
function _bootstrap()
{
	// First of all, starts the session.
	session_start();

	// Class autoloading is done by composer.
	require(__DIR__.'/../vendor/autoload.php');

	// Reads configuration.
	$config = new Config;
	foreach (array('global', 'local') as $file)
	{
		$file = __DIR__.'/../config/'.$file.'.php';
		if (is_file($file))
		{
			$config->merge(require($file));
		}
	}

	// Injects some variables.
	$config['root_dir'] = __DIR__.'/..';

	// Creates the service locator
	$locator = new ServiceLocator;
	$locator->set('config', $config);

	// Loggs all errors.
	$error_logger = $locator->get('error_logger');
	set_error_handler(array($error_logger, 'log'));
	register_shutdown_function(array($error_logger, 'handleShutdown'));

	return $locator;
}

// Bootstraps the application and gets the locator.
$locator = _bootstrap();

// Creates the current context.
$context = \Switchman\Context\HTTP::createFromGlobals(true);
$locator->get('config')['base_path'] = $context['base_path'];

// Gets the available routes.
$routes  = $locator->get('routes');

// Matches the routes to obtain current parameters.
$parameters = $routes->match($context);

// Basic error message if no route found.
if (!$parameters
    || !($controller = $locator->get('controller.'.$parameters['controller'], false)))
{
	header('HTTP/1.1 404 Not Found');

	trigger_error(
		'no route found for: '.$context['path'],
		E_USER_ERROR
	);
}

// @todo Not sure it is the right place to put the current route.
$locator->set('current_controller', $parameters['controller']);

// Dispatches the current action.
$controller->dispatch($parameters['action'], $parameters);
