angular = require 'angular'
throttle = require 'lodash.throttle'

#=====================================================================

module.exports = angular.module 'xoWebApp.tree', [
  require 'angular-file-upload'
  require 'angular-ui-router'

  require '../delete-vms'
]
  .config ($stateProvider) ->
    $stateProvider.state 'tree',
      url: '/'
      controller: 'TreeCtrl'
      template: require './view'
  .controller 'TreeCtrl', ($scope, modal, $upload, xo, dateFilter, deleteVmsModal, notify) ->
    VMs = []
    $scope.$watch(
      -> xo.revision
      (revision) ->
        return if revision is 0

        {byTypes} = xo

        $scope.xo = byTypes.xo[0]

        $scope.pools = byTypes.pool
        $scope.hosts = byTypes.host

        VMs = $scope.VMs = byTypes.VM ? []
    )
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

    $scope.startVM = xo.vm.start
    $scope.stopVM = xo.vm.stop
    $scope.force_stopVM = (id) -> xo.vm.stop id, true
    $scope.rebootVM = xo.vm.restart
    $scope.force_rebootVM = (id) -> xo.vm.restart id, true
    $scope.suspendVM = (id) -> xo.vm.suspend id, true
    $scope.resumeVM = (id) -> xo.vm.resume id, true

    $scope.migrateVM = (id, hostId) ->
      (xo.vm.migrate id, hostId).catch (error) ->
        modal.confirm
          title: 'VM migrate'
          message: 'This VM can\'t be migrated with Xen Motion to this host because they don\'t share any storage. Do you want to try a Xen Storage Motion?'

        .then ->
          notify.info {
            title: 'VM migration'
            message: 'The migration process started'
          }

          xo.vm.migratePool {
            id
            target_host_id: hostId
          }
    $scope.snapshotVM = (id) ->
      vm = xo.get (id)
      date = dateFilter Date.now(), 'yyyy-MM-ddTHH:mmZ'
      snapshot_name = "#{vm.name_label}_#{date}"
      xo.vm.createSnapshot id, snapshot_name
    # check if there is any operation pending on a VM
    $scope.isVMWorking = (VM) ->
      return true for _ of VM.current_operations
      false

    # extract a value in a object
    $scope.values = (object) ->
      value for _, value of object

    $scope.deleteVMs = ->
      {selected_VMs} = $scope

      deleteVmsModal (id for id, selected of selected_VMs when selected)

    $scope.osType = (osName) ->
      switch osName
        when 'debian','ubuntu','centos','redhat','oracle','gentoo','suse','fedora','sles'
          'linux'
        when 'windows'
          'windows'
        else
          'other'

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
        $scope.all = (VMs.length is n)
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
          $scope.n_selected_VMs = if sieve then VMs.length else 0
          selected_VMs[VM.UUID] = sieve for VM in VMs
          return

        n = 0

        matcher = make_matcher sieve
        ++n for VM in VMs when (selected_VMs[VM.UUID] = matcher VM)

        $scope.n_selected_VMs = n

      $scope.updateVMSelection = (UUID) ->
        if selected_VMs[UUID]
          ++$scope.n_selected_VMs
        else
          --$scope.n_selected_VMs

      $scope.bulkAction = (action, args...) ->
        fn = $scope[action]
        unless angular.isFunction fn
          throw new Error "invalid action #{action}"

        for UUID, selected of selected_VMs
          fn UUID, args... if selected

        # Unselects all VMs.
        $scope.selectVMs false

      $scope.importVm = ($files, id) ->
        file = $files[0]

        xo.vm.import id
        .then ({ $sendTo: url }) ->
          return $upload.http {
            method: 'POST'
            url
            data: file
          }
          .progress throttle(
            (event) ->
              percentage = (100 * event.loaded / event.total)|0

              notify.info
                title: 'VM import'
                message: "#{percentage}%"
            6e3
          )
        .then (result) ->
          throw result.status if result.status isnt 200
          notify.info
            title: 'VM import'
            message: 'Success'

      $scope.patchPool = ($files, id) ->
        file = $files[0]
        xo.pool.patch id
        .then ({ $sendTo: url }) ->
          return $upload.http {
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

  # A module exports its name.
  .name
