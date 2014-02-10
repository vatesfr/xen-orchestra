'use strict'

angular.module('xoWebApp')
  .controller 'MainCtrl', ($scope, $modal, xo) ->
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
    $scope.pool_removeHost = xo.host.detach
    $scope.rebootHost = xo.host.restart
    $scope.restartToolStack = xo.host.restartToolStack
    $scope.shutdownHost = xo.host.stop

    $scope.startVM = xo.vm.start
    $scope.stopVM = xo.vm.stop
    $scope.force_stopVM = (id) -> xo.vm.stop id, true
    $scope.rebootVM = xo.vm.restart
    $scope.force_rebootVM = (id) -> xo.vm.restart id, true
    $scope.migrateVM = xo.vm.migrate
    $scope.createVMSnapshot = xo.vm.createSnapshot
    # check if there is any operation pending on a VM
    $scope.isVMWorking = (VM) ->
      return true for _ of VM.current_operations
      false

    # extract a value in a object
    $scope.values = (object) ->
      value for _, value of object

    $scope.deleteVMs = ->
      {selected_VMs} = $scope

      VMsIds = (id for id, selected of selected_VMs when selected)
      modal = $modal.open {
        controller: 'DeleteVMsCtrl'
        templateUrl: 'views/delete_vms.html'
        resolve: {
          VMsIds: -> VMsIds
        }
      }

      modal.result.then (toDelete) ->
        for [id, deleteDisks] in toDelete
          xo.vm.delete id, deleteDisks

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

      $scope.osType = (osName) ->
        switch osName
          when 'debian','ubuntu','centos','suse','redhat','oracle','gentoo'
            'linux'
          when 'windows'
            'windows'
          else
            'other'
