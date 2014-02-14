'use strict'

angular.module('xoWebApp', [
  'ngCookies'

  'ui.bootstrap'
  'ui.indeterminate'
  'ui.route'
  'ui.router'
  'ui.select2'

  'naturalSort'
  'toaster'
  'xeditable'
])
  .config ($stateProvider, $urlRouterProvider, $tooltipProvider) ->
    # Redirects unmatched URLs to `/`.
    $urlRouterProvider.otherwise '/'

    # Sets up the different states for our module.
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
        url: '/hosts/:id'
        controller: 'HostCtrl'
        templateUrl: 'views/host.html'

      .state 'SRs_view',
        url: '/srs/:id'
        controller: 'SrCtrl'
        templateUrl: 'views/sr.html'

      .state 'SRs_new',
        url: '/srs/new/:container'
        controller: 'NewSrCtrl'
        templateUrl: 'views/new_sr.html'

      .state 'pools_view',
        url: '/pools/:id'
        controller: 'PoolCtrl'
        templateUrl: 'views/pool.html'

      .state 'VMs_new',
        url: '/vms/new/:container'
        controller: 'NewVmCtrl'
        templateUrl: 'views/new_vm.html'

      .state 'VMs_view',
        url: '/vms/:id'
        controller: 'VmCtrl'
        templateUrl: 'views/vm.html'

      .state 'consoles_view',
        url: '/consoles/:id'
        controller: 'ConsoleCtrl'
        templateUrl: 'views/console.html'

      .state 'about',
        url: '/about'
        templateUrl: 'views/about.html'

      .state 'settings',
        url: '/settings'
        controller: 'SettingsCtrl'
        templateUrl: 'views/settings.html'

    # Changes the default settings for the tooltips.
    $tooltipProvider.options
      appendToBody: true
      placement: 'bottom'

  .run (editableOptions, editableThemes) ->
    editableThemes.bs3.inputClass = 'input-sm'
    editableThemes.bs3.buttonsClass = 'btn-sm'
    editableOptions.theme = 'bs3'
