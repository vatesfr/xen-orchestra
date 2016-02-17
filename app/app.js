// Must be loaded before angular.
import 'angular-file-upload'

import angular from 'angular'
import uiBootstrap from'angular-ui-bootstrap'
import uiIndeterminate from'angular-ui-indeterminate'
import uiRouter from'angular-ui-router'
import uiSelect from'angular-ui-select'

import naturalSort from 'angular-natural-sort'
import xeditable from 'angular-xeditable'

import xoDirectives from 'xo-directives'
import xoFilters from 'xo-filters'
import xoServices from 'xo-services'

import aboutState from './modules/about'
import backupState from './modules/backup'
import consoleState from './modules/console'
import dashboardState from './modules/dashboard'
import deleteVmsState from './modules/delete-vms'
import genericModalState from './modules/generic-modal'
import hostState from './modules/host'
import listState from './modules/list'
import migrateVmState from './modules/migrate-vm'
import navbarState from './modules/navbar'
import newSrState from './modules/new-sr'
import newVmState from './modules/new-vm'
import poolState from './modules/pool'
import selfState from './modules/self'
import settingsState from './modules/settings'
import srState from './modules/sr'
import taskScheduler from './modules/task-scheduler'
import treeState from './modules/tree'
import updater from './modules/updater'
import vmState from './modules/vm'

import '../dist/bower_components/angular-chart.js/dist/angular-chart.js'

// ===================================================================

export default angular.module('xoWebApp', [
  uiBootstrap,
  uiIndeterminate,
  uiRouter,
  uiSelect,

  naturalSort,
  xeditable,

  xoDirectives,
  xoFilters,
  xoServices,

  aboutState,
  backupState,
  consoleState,
  dashboardState,
  deleteVmsState,
  genericModalState,
  hostState,
  listState,
  migrateVmState,
  navbarState,
  newSrState,
  newVmState,
  poolState,
  selfState,
  settingsState,
  srState,
  taskScheduler,
  treeState,
  updater,
  vmState,
  'chart.js'
])

  // Prevent Angular.js from mangling exception stack (interfere with
  // source maps).
  .factory('$exceptionHandler', () => function (exception) {
    console.log(exception && exception.stack || exception)
  })

  .config(function (
    $compileProvider,
    $stateProvider,
    $urlRouterProvider,
    $tooltipProvider,
    uiSelectConfig
  ) {
    // Disable debug data to improve performance.
    //
    // In case of a bug, simply use `angular.reloadWithDebugInfo()` in
    // the console.
    //
    // See https://docs.angularjs.org/guide/production
    $compileProvider.debugInfoEnabled(false)

    // Redirect to default state.
    $stateProvider.state('index', {
      url: '/',
      controller: function ($state, xoApi) {
        let isAdmin = xoApi.user && (xoApi.user.permission === 'admin')

        $state.go(isAdmin ? 'tree' : 'list')
      }
    })

    // Redirects unmatched URLs to `/`.
    $urlRouterProvider.otherwise('/')

    // Changes the default settings for the tooltips.
    $tooltipProvider.options({
      appendToBody: true,
      placement: 'bottom'
    })

    uiSelectConfig.theme = 'bootstrap'
    uiSelectConfig.resetSearchInput = true
  })
  .run(function (
    $anchorScroll,
    $rootScope,
    $state,
    editableOptions,
    editableThemes,
    notify,
    updater,
    xoApi
  ) {
    let requestedStateName, requestedStateParams

    $rootScope.$watch(() => xoApi.user, (user, previous) => {
      // The user just signed in.
      if (user && !previous) {
        if (requestedStateName) {
          $state.go(requestedStateName, requestedStateParams)
          requestedStateName = requestedStateParams = null
        } else {
          $state.go('index')
        }
      }
    })

    $rootScope.$on('$stateChangeStart', function (event, state, stateParams, fromState) {
      const { user } = xoApi
      if (!user) {
        event.preventDefault()

        requestedStateName = state.name
        requestedStateParams = stateParams

        return
      }

      if (user.permission === 'admin') {
        return
      }

      function forbidState () {
        event.preventDefault()
        notify.error({
          title: 'Restricted area',
          message: 'You do not have the permission to view this page'
        })

        if (fromState.url === '^') {
          $state.go('index')
        }
      }

      // Some pages requires the admin permission.
      if (state.data && state.data.requireAdmin) {
        forbidState()
        return
      }

      const { id } = stateParams
      if (id && !xoApi.canInteract(id, 'view')) {
        forbidState()
        return
      }
    })

    // Work around UI Router bug (https://github.com/angular-ui/ui-router/issues/1509)
    $rootScope.$on('$stateChangeSuccess', function () {
      $anchorScroll()
    })

    editableThemes.bs3.inputClass = 'input-sm'
    editableThemes.bs3.buttonsClass = 'btn-sm'
    editableOptions.theme = 'bs3'
  })

  .name
