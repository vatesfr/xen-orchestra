'use strict'

angular.module('xoWebApp', [
  # 'ngCookies'
  'ngRoute'
  # 'ngSanitize'

  'ui.bootstrap'
  'ui.indeterminate'
  'ui.route'
  'ui.router'

  'xeditable'
  'ui.select2'
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
      .when '/vms/new',
        templateUrl: 'views/new_vm.html'
        controller: 'NewVmCtrl'
      .when '/vms/:uuid',
        templateUrl: 'views/vm.html'
        controller: 'VmCtrl'
      .when '/console',
        templateUrl: 'views/console.html'
        controller: 'ConsoleCtrl'
      .when '/about',
        templateUrl: 'views/about.html'
        controller: 'AboutCtrl'
      .when '/servers/new',
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

  .run (editableOptions, editableThemes) ->
    editableThemes.bs3.inputClass = 'input-sm'
    editableThemes.bs3.buttonsClass = 'btn-sm'
    editableOptions.theme = 'bs3'
