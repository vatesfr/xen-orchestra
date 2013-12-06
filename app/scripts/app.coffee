'use strict'

angular.module('xoWebApp', [
  'ui.bootstrap'
  'ui.indeterminate'
  'ui.route'
  'ui.router'

  'xeditable'
  'ui.select2'
])
  .config ($stateProvider, $urlRouterProvider, $tooltipProvider) ->
    # Redirects unmatched URLs to `/`.
    $urlRouterProvider.otherwise '/'

    # Sets up the differents states for our module.
    $stateProvider
      .state 'home',
        url: '/'
        controller: 'MainCtrl'
        templateUrl: 'views/main.html'

      .state 'list',
        url: '/list'
        controller: 'ListCtrl'
        templateUrl: 'views/list.html'

      .state 'hosts_view',
        url: '/hosts/:uuid'
        controller: 'HostCtrl'
        templateUrl: 'views/host.html'

      .state 'SRs_view',
        url: '/srs/:uuid'
        controller: 'SrCtrl'
        templateUrl: 'views/sr.html'

      .state 'pools_view',
        url: '/pools/:uuid'
        controller: 'PoolCtrl'
        templateUrl: 'views/pool.html'

      .state 'VMs_new',
        url: '/vms/new'
        controller: 'NewVmCtrl'
        templateUrl: 'views/new_vm.html'
      .state 'VMs_view',
        url: '/vms/:uuid'
        controller: 'VmCtrl'
        templateUrl: 'views/vm.html'

      .state 'consoles_view',
        url: '/consoles/:uuid'
        controller: 'ConsoleCtrl'
        templateUrl: 'views/console.html'

      .state 'about',
        url: '/about'
        controller: 'AboutCtrl'
        templateUrl: 'views/about.html'

      .state 'servers_new',
        url: '/servers/new'
        controller: 'NewServerCtrl'
        templateUrl: 'views/new_server.html'

      .state 'settings',
        url: '/settings'
        controller: 'SettingsCtrl'
        templateUrl: 'views/settings.html'

      .state 'users_new',
        url: '/users/new'
        controller: 'NewUserCtrl'
        templateUrl: 'views/new_user.html'

    # Changes the default settings for the tooltips.
    $tooltipProvider.options
      appendToBody: true
      placement: 'bottom'

  .run (editableOptions, editableThemes) ->
    editableThemes.bs3.inputClass = 'input-sm'
    editableThemes.bs3.buttonsClass = 'btn-sm'
    editableOptions.theme = 'bs3'
