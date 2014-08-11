
window.jQuery = window.$ = require 'jquery'

require 'angular'
require 'angular-animate'
require 'angular-cookies'

require 'angular-bootstrap'
require 'angular-ui-router'
require 'angular-ui-utils'
require 'angular-notify-toaster'
require 'angular-xeditable'
require 'select2'
require 'angular-ui-select2'
require 'angularjs-naturalsort'

#=====================================================================

angular.module 'xoWebApp', [
  'ngCookies'

  'ui.bootstrap'
  'ui.indeterminate'
  'ui.router'
  'ui.select2'

  'naturalSort'
  'toaster'
  'xeditable'

  (require './directives').name
  (require './filters').name
  (require './services').name

  (require './modules/console').name
  (require './modules/generic-modal').name
  (require './modules/login').name
  (require './modules/settings').name
]
  .controller 'NavBarCtrl', require './controllers/nav_bar'
  .config ($stateProvider, $urlRouterProvider, $tooltipProvider) ->
    # Redirects unmatched URLs to `/`.
    $urlRouterProvider.otherwise '/'

    # Sets up the different states for our module.
    $stateProvider

      .state 'home',
        url: '/'
        controller: require './controllers/main'
        template: require './views/main'

      .state 'list',
        url: '/list'
        controller: require './controllers/list'
        template: require './views/list'

      .state 'hosts_view',
        url: '/hosts/:id'
        controller: require './controllers/host'
        template: require './views/host'

      .state 'SRs_view',
        url: '/srs/:id'
        controller: require './controllers/sr'
        template: require './views/sr'

      .state 'SRs_new',
        url: '/srs/new/:container'
        controller: require './controllers/new_sr'
        template: require './views/new_sr'

      .state 'pools_view',
        url: '/pools/:id'
        controller: require './controllers/pool'
        template: require './views/pool'

      .state 'VMs_new',
        url: '/vms/new/:container'
        controller: require './controllers/new_vm'
        template: require './views/new_vm'

      .state 'VMs_view',
        url: '/vms/:id'
        controller: require './controllers/vm'
        template: require './views/vm'

      .state 'about',
        url: '/about'
        template: require './views/about'

    # Changes the default settings for the tooltips.
    $tooltipProvider.options
      appendToBody: true
      placement: 'bottom'
  .run ($rootScope, $state, xoApi, editableOptions, editableThemes, notify, $templateCache) ->
    $rootScope.$on '$stateChangeStart', (event, state, stateParams) ->
      {user} = xoApi
      loggedIn = user?

      if state.name is 'login'
        if loggedIn
          event.preventDefault()
          $state.go 'home'
        return

      unless loggedIn
        event.preventDefault()

        # FIXME: find a better way to pass info to the login controller.
        $rootScope._login = { state, stateParams }

        $state.go 'login'
        return

      # The user must have the `admin` permission to access the
      # settings page.
      if state.name is 'settings' and user.permission isnt 'admin'
        event.preventDefault()
        notify.error
          title: 'Restricted area'
          message: 'You do not have the permission to view this page'

    editableThemes.bs3.inputClass = 'input-sm'
    editableThemes.bs3.buttonsClass = 'btn-sm'
    editableOptions.theme = 'bs3'

    $templateCache.put 'nav_bar.html', require './views/nav_bar'
