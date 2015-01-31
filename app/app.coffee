# Must be loaded before angular.
angularFileUpload = require('angular-file-upload')
angular = require 'angular'

#=====================================================================

angular.module 'xoWebApp', [
  require 'angular-ui-bootstrap'
  require 'angular-ui-indeterminate'
  require 'angular-ui-router'
  require 'angular-ui-select'

  require 'angular-natural-sort'
  require 'angular-xeditable'

  require './directives'
  require './filters'
  require 'xo-services'

  require './modules/about'
  require './modules/admin'
  require './modules/console'
  require './modules/delete-vms'
  require './modules/generic-modal'
  require './modules/host'
  require './modules/list'
  require './modules/login'
  require './modules/navbar'
  # require './modules/new-sr'
  require './modules/new-vm'
  require './modules/pool'
  require './modules/settings'
  require './modules/sr'
  require './modules/tree'
  require './modules/vm'
]

  # Prevent Angular.js from mangling exception stack (interfere with
  # source maps).
  .factory '$exceptionHandler', ->
    return (exception) -> throw exception

  .config (
    $compileProvider,
    $stateProvider,
    $urlRouterProvider,
    $tooltipProvider,
    uiSelectConfig
  ) ->
    # Disable debug data to improve performance.
    #
    # In case of a bug, simply use `angular.reloadWithDebugInfo()` in
    # the console.
    #
    # See https://docs.angularjs.org/guide/production
    $compileProvider.debugInfoEnabled false

    # Redirect to default state.
    $stateProvider.state('index', {
      url: '',
      controller: ($state, xoApi) ->
        defaultState =
          if xoApi.user?.permission is 'admin'
            'tree'
          else
            'list'

        $state.go(defaultState)
        return
    })

    # Redirects unmatched URLs to `/`.
    $urlRouterProvider.otherwise '/'

    # Changes the default settings for the tooltips.
    $tooltipProvider.options
      appendToBody: true
      placement: 'bottom'

    uiSelectConfig.theme = 'bootstrap'
    uiSelectConfig.resetSearchInput = true

  .run (
    $anchorScroll
    $rootScope
    $state
    editableOptions
    editableThemes
    notify
    xoApi
  ) ->
    $rootScope.$on '$stateChangeStart', (event, state, stateParams) ->
      {user} = xoApi
      loggedIn = user?

      if state.name is 'login'
        if loggedIn
          event.preventDefault()
          $state.go 'index'
        return

      unless loggedIn
        event.preventDefault()

        # FIXME: find a better way to pass info to the login controller.
        $rootScope._login = { state, stateParams }

        $state.go 'login'
        return

      # The user must have the `admin` permission to access the
      # settings and admin pages.
      if (
        (/^admin\..*|settings|tree$/.test state.name) and
        user.permission isnt 'admin'
      )
        event.preventDefault()
        notify.error
          title: 'Restricted area'
          message: 'You do not have the permission to view this page'

    # Work around UI Router bug (https://github.com/angular-ui/ui-router/issues/1509)
    $rootScope.$on '$stateChangeSuccess', ->
      $anchorScroll()
      return

    editableThemes.bs3.inputClass = 'input-sm'
    editableThemes.bs3.buttonsClass = 'btn-sm'
    editableOptions.theme = 'bs3'
