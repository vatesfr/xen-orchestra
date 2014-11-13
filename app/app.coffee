# Must be loaded before angular.
angularFileUpload = require('angular-file-upload')
angular = require 'angular'

#=====================================================================

angular.module 'xoWebApp', [
  require 'angular-ui-bootstrap'
  require 'angular-ui-indeterminate'
  require 'angular-ui-router'

  require 'angular-natural-sort'
  require 'angular-xeditable'

  require './directives'
  require './filters'
  require './services'

  require './modules/about'
  require './modules/console'
  require './modules/delete-vms'
  require './modules/generic-modal'
  require './modules/home'
  require './modules/host'
  require './modules/list'
  require './modules/login'
  require './modules/navbar'
  require './modules/new-sr'
  require './modules/new-vm'
  require './modules/pool'
  require './modules/settings'
  require './modules/sr'
  require './modules/vm'
]

  # Prevent Angular.js from mangling exception stack (interfere with
  # source maps).
  .factory '$exceptionHandler', ->
    return (exception) -> throw exception

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
