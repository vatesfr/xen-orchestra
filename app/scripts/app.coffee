'use strict'

angular.module('xoWebApp', [
  # 'ngCookies',
  'ngRoute',
  # 'ngSanitize',
  'ui.bootstrap',
])
  .config ($routeProvider, $tooltipProvider) ->
    $routeProvider
      .when '/',
        templateUrl: 'views/main.html'
        controller: 'MainCtrl'
      .when '/list',
        templateUrl: 'views/list.html'
        controller: 'ListCtrl'
      .when '/hosts/:uuid',
        templateUrl: 'views/host.html'
        controller: 'HostCtrl'
      .when '/srs/:uuid',
        templateUrl: 'views/sr.html'
        controller: 'SrCtrl'
      .when '/pools/:uuid',
        templateUrl: 'views/pool.html'
        controller: 'PoolCtrl'
      .when '/vms/:uuid',
        templateUrl: 'views/vm.html'
        controller: 'VmCtrl'
      .when '/console',
        templateUrl: 'views/console.html'
        controller: 'ConsoleCtrl'
      .when '/about',
        templateUrl: 'views/about.html'
        controller: 'AboutCtrl'
      .when '/server/new',
        templateUrl: 'views/new_server.html'
        controller: 'NewServerCtrl'
      .when '/settings',
        templateUrl: 'views/settings.html'
        controller: 'SettingsCtrl'
      .when '/user/new',
        templateUrl: 'views/new_user.html'
        controller: 'NewUserCtrl'
      .otherwise
        redirectTo: '/'

    # FIXME: Tooltip incorrect positionning.
    $tooltipProvider.options {
      appendToBody: true
      placement: 'bottom'
    }
