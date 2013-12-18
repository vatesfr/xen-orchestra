'use strict'

angular.module('xoWebApp')
  .controller 'MainCtrl', ($scope, xoObjects) ->
    VMs = []
    $scope.$watch(
      -> xoObjects.revision
      (revision) ->
        return if revision is 0

        {byTypes} = xoObjects

        $scope.xo = byTypes.xo[0]

        $scope.pools = byTypes.pool
        $scope.hosts = byTypes.host

        VMs = $scope.VMs = byTypes.VM
    )

    # VMs checkboxes.
    do ->
      # This map marks which VMs are selected.
      selected_VMs = $scope.selected_VMs = {}

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
