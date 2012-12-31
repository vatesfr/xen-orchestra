<?php
/**
 *
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

		// Class autoloading.
		require($root_dir.'/../vendor/autoload.php');

		// Dependency injector.
		$di = new DI;

		// Finally, creates the inventory.
		$application = $di->get('application');
	}

	return $application;
}

return _bootstrap();
