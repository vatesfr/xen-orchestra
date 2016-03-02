angular = require 'angular'
forEach = require 'lodash.foreach'
throttle = require 'lodash.throttle'

#=====================================================================

sourceHost = null

module.exports = angular.module 'xoWebApp.tree', [
  require 'angular-ui-router'
  require('ng-file-upload')

  require('xo-api').default
  require('xo-services').default

  require('../delete-vms').default
]
  .config ($stateProvider) ->
    $stateProvider.state 'tree',
      controller: 'TreeCtrl'
      data: {
        requireAdmin: true
      },
      template: require './view'
      url: '/tree'
  .controller 'TreeCtrl', (
    $scope
    dateFilter
    deleteVmsModal
    modal
    notify
    Upload
    xo
    xoApi
  ) ->
    $scope.stats = xoApi.stats

    $scope.hosts = xoApi.getView('hosts')
    $scope.hostsByPool = xoApi.getIndex('hostsByPool')

    $scope.pools = xoApi.getView('pools')

    VMs = $scope.VMs = xoApi.getView('VM')
    $scope.runningVms = xoApi.getView('runningVms')
    $scope.runningVmsByPool = xoApi.getIndex('runningVmsByPool')
    $scope.vmsByPool = xoApi.getIndex('vmsByPool')
    $scope.vmsByContainer = xoApi.getIndex('vmsByContainer')
    $scope.vmControllersByContainer = xoApi.getIndex('vmControllersByContainer')

    $scope.srsByContainer = xoApi.getIndex('srsByContainer')

    $scope.pool_disconnect = xo.pool.disconnect
    $scope.new_sr = xo.pool.new_sr

    $scope.pool_addHost = (id) ->
      xo.host.attach id

    $scope.enableHost = (id) ->
      xo.host.enable id
      notify.info {
        title: 'Host action'
        message: 'Host is enabled'
      }

    $scope.disableHost = (id) ->
      modal.confirm({
        title: 'Disable host'
        message: 'Are you sure you want to disable this host? In disabled state, no new VMs can be started and currently active VMs on the host continue to execute.'
      }).then ->
        xo.host.disable id
      .then ->
        notify.info {
          title: 'Host action'
          message: 'Host is disabled'
        }

    $scope.pool_removeHost = (id) ->
      modal.confirm({
        title: 'Remove host from pool'
        message: 'Are you sure you want to detach this host from its pool? It will be automatically rebooted'
      }).then ->
        xo.host.detach id

    $scope.rebootHost = (id) ->
      modal.confirm({
        title: 'Reboot host'
        message: 'Are you sure you want to reboot this host? It will be disabled then rebooted'
      }).then ->
        xo.host.restart id

    $scope.restartToolStack = (id) ->
      modal.confirm({
        title: 'Restart XAPI'
        message: 'Are you sure you want to restart the XAPI toolstack?'
      }).then ->
        xo.host.restartToolStack id

    $scope.shutdownHost = (id) ->
      modal.confirm({
        title: 'Shutdown host'
        message: 'Are you sure you want to shutdown this host?'
      }).then ->
        xo.host.stop id

    $scope.startHost = (id) ->
      xo.host.start id

    bulkConfirms = {
      'stopVM': {
        title: 'VM shutdown',
        message: 'Are you sure you want to shutdown all selected VMs ?'
      },
      'rebootVM': {
        title: 'VM reboot',
        message: 'Are you sure you want to reboot all selected VMs ?'
      },
      'suspendVM': {
        title: 'VM suspend',
        message: 'Are you sure you want to suspend all selected VMs ?'
      },
      'force_rebootVM': {
        title: 'VM force reboot',
        message: 'Are you sure you want to force reboot for all selected VMs ?'
      },
      'force_stopVM': {
        title: 'VM force shutdown',
        message: 'Are you sure you want to force shutdown for all selected VMs ?'
      },
      'migrateVM': {
        title: 'VM migrate',
        message: 'Are you sure you want to migrate all selected VMs ?'
      }
    }

    unitConfirms = {
      'stopVM': {
        title: 'VM shutdown',
        message: 'Are you sure you want to shutdown this VM ?'
      },
      'rebootVM': {
        title: 'VM reboot',
        message: 'Are you sure you want to reboot this VM ?'
      },
      'suspendVM': {
        title: 'VM suspend',
        message: 'Are you sure you want to suspend this VM ?'
      },
      'force_rebootVM': {
        title: 'VM force reboot',
        message: 'Are you sure you want to force reboot for this VM ?'
      },
      'force_stopVM': {
        title: 'VM force shutdown',
        message: 'Are you sure you want to force shutdown for this VM ?'
      },
      'migrateVM': {
        title: 'VM migrate',
        message: 'Are you sure you want to migrate this VM ?'
      }
    }

    $scope.startVM = xo.vm.start
    $scope.stopVM = xo.vm.stop
    $scope.force_stopVM = (id) -> xo.vm.stop id, true
    $scope.rebootVM = xo.vm.restart
    $scope.force_rebootVM = (id) -> xo.vm.restart id, true
    $scope.suspendVM = (id) -> xo.vm.suspend id
    $scope.resumeVM = (id) -> xo.vm.resume id, true
    $scope.migrateVM = (id, hostId) -> xo.vm.migrate id, hostId

    $scope.snapshotVM = (id) ->
      vm = xoApi.get(id)
      date = dateFilter Date.now(), 'yyyy-MM-ddTHH:mmZ'
      snapshot_name = "#{vm.name_label}_#{date}"
      xo.vm.createSnapshot id, snapshot_name
    # check if there is any operation pending on a VM
    $scope.isVMWorking = (VM) ->
      return true for _ of VM.current_operations
      false

    $scope.deleteVMs = ->
      {selected_VMs} = $scope

      deleteVmsModal (id for id, selected of selected_VMs when selected)

    # VMs checkboxes.
    do ->
      # This map marks which VMs are selected.
      selected_VMs = $scope.selected_VMs = Object.create null

      # Number of selected VMs.
      $scope.n_selected_VMs = 0

      # This is the master checkbox.
      # Three states: true/false/null
      $scope.master_selection = false

      # Wheter all VMs are selected.
      $scope.all = false

      # Whether no VMs are selected.
      $scope.none = true

      # Updates `all`, `none` and `master_selection` when necessary.
      $scope.$watch 'n_selected_VMs', (n) ->
        $scope.all = (VMs.size is n)
        $scope.none = (n is 0)

        # When the master checkbox is clicked from indeterminate
        # state, it should go to unchecked like Gmail.
        $scope.master_selection = (n isnt 0)

      make_matcher = (sieve) ->
        (item) ->
          for key, val of sieve
            return false unless item[key] is val
          true

      $scope.selectVMs = (sieve) ->
        if (sieve is true) or (sieve is false)
          forEach(VMs.all, (VM) ->
            selected_VMs[VM.id] = sieve
            return
          )
          $scope.n_selected_VMs = if sieve then VMs.size else 0
          return

        matcher = make_matcher sieve
        n = 0
        forEach(VMs.all, (VM) ->
          if (selected_VMs[VM.id] = matcher(VM))
            ++n
          return
        )

        $scope.n_selected_VMs = n

      $scope.updateVMSelection = (id) ->
        if selected_VMs[id]
          ++$scope.n_selected_VMs
        else
          --$scope.n_selected_VMs

      $scope.bulkAction = (action, args...) ->
        fn = $scope[action]
        unless angular.isFunction fn
          throw new Error "invalid action #{action}"

        runBulk = () ->
          for id, selected of selected_VMs
            fn id, args... if selected
          # Unselects all VMs.
          $scope.selectVMs false

        if action of bulkConfirms
          modal.confirm(bulkConfirms[action])
          .then runBulk
        else
          runBulk()

      $scope.confirmAction = (action, args...) ->
        fn = $scope[action]
        unless angular.isFunction fn
          throw new Error "invalid action #{action}"

        doAction = () ->
          fn args...

        if action of unitConfirms
          modal.confirm(unitConfirms[action])
          .then doAction
        else
          doAction()

      $scope.importVm = ($files, id) ->
        file = $files[0]
        notify.info {
          title: 'VM import started'
          message: "Starting the VM import"
        }

        xo.vm.import id
        .then ({ $sendTo: url }) ->
          return Upload.http {
            method: 'POST'
            url
            data: file
          }
        .then (result) ->
          throw result.status if result.status isnt 200
          notify.info
            title: 'VM import'
            message: 'Success'

      $scope.patchPool = ($files, id) ->
        file = $files[0]
        xo.pool.patch id
        .then ({ $sendTo: url }) ->
          return Upload.http {
            method: 'POST'
            url
            data: file
          }
          .progress throttle(
            (event) ->
              percentage = (100 * event.loaded / event.total)|0

              notify.info
                title: 'Upload patch'
                message: "#{percentage}%"
            6e3
          )
        .then (result) ->
          throw result.status if result.status isnt 200
          notify.info
            title: 'Upload patch'
            message: 'Success'
  .directive 'draggable', () ->
    {
      link: (scope, element, attr) ->
        element.on 'dragstart', (event) ->
          event.originalEvent.dataTransfer.setData('vm', event.currentTarget.getAttribute('vm'))
          # event.originalEvent.dataTransfer.setData('host', event.currentTarget.getAttribute('host'))
          sourceHost = event.currentTarget.getAttribute('host')
          element.addClass('xo-dragged')
          $('[droppable]:not([host="' + sourceHost + '"])').addClass('xo-drop-legit')

        element.on 'dragend', (event) ->
          element.removeClass('xo-dragged')
          $('[droppable]').removeClass('xo-drop-target xo-drop-legit')
          sourceHost = null
      restrict: 'A'
    }
  .directive 'droppable', (xo, notify, modal) ->
    {
      link: (scope, element, attr) ->
        element.on 'dragover', (event) ->
          event.preventDefault()
          targetHost = event.currentTarget.getAttribute('host')
          if sourceHost isnt targetHost
            element.addClass('xo-drop-target').removeClass('xo-drop-legit')

        element.on 'dragleave', (event) ->
          targetHost = event.currentTarget.getAttribute('host')
          if sourceHost isnt targetHost
            element.removeClass('xo-drop-target')
            element.addClass('xo-drop-legit')

        element.on 'drop', (event) ->
          event.preventDefault()
          vm = event.originalEvent.dataTransfer.getData('vm')
          # sourceHost = event.originalEvent.dataTransfer.getData('host')
          targetHost = event.currentTarget.getAttribute('host')
          if sourceHost isnt targetHost
            modal.confirm
              title: 'VM migrate'
              message: 'Are you sure you want to migrate this VM?'
            .then ->
              xo.vm.migrate vm, targetHost
      restrict: 'A'
    }
  # A module exports its name.
  .name
