
window.jQuery = window.$ = require 'jquery'

require 'angular'
require 'angular-animate'

require 'angular-bootstrap'
require 'angular-natural-sort'
require 'angular-ui-router'
require 'angular-ui-utils'
require 'angular-xeditable'

#=====================================================================

angular.module 'xoWebApp', [

  'ui.bootstrap'
  'ui.indeterminate'
  'ui.router'

  'naturalSort'
  'xeditable'

  (require './directives').name
  (require './filters').name
  (require './services').name

  (require './modules/about').name
  (require './modules/console').name
  (require './modules/delete-vms').name
  (require './modules/generic-modal').name
  (require './modules/home').name
  (require './modules/host').name
  (require './modules/list').name
  (require './modules/login').name
  (require './modules/navbar').name
  (require './modules/new-sr').name
  (require './modules/new-vm').name
  (require './modules/pool').name
  (require './modules/settings').name
  (require './modules/sr').name
  (require './modules/vm').name
]
  .config ($urlRouterProvider, $tooltipProvider) ->
    # Redirects unmatched URLs to `/`.
    $urlRouterProvider.otherwise '/'

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
