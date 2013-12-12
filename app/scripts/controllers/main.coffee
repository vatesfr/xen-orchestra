'use strict'

angular.module('xoWebApp')
  .controller 'MainCtrl', ($scope, stats, xoObjects) ->
    $scope.stats = stats.stats

    # VMs checkboxes.
    do ->
      # This map marks which VMs are selected.
      $scope.selected_VMs = {}

      # Number of selected VMs.
      $scope.n_selected_VMs = 0

      # This is the master checkbox.
      # Three states: true/false/null
      $scope.master_selection = false

      # Wheter all VMs are selected.
      $scope.all = false

      # Whether no VMs are selected.
      $scope.none = true

      # Extract some variables for performance and readability.
      {selected_VMs, VMs} = $scope

      # Updates `all`, `none` and `master_selection` when necessary.
      $scope.$watch 'n_selected_VMs', (n) ->
        $scope.all = (n == VMs?.length)
        $scope.none = (0 == n)

        # When the master checkbox is clicked from indeterminate
        # state, it should go to unchecked like Gmail.
        $scope.master_selection = (0 != n)

      make_matcher = (sieve) ->
        (item) ->
          for key, val of sieve
            return false unless item[key] == val
          true

      $scope.selectVMs = (sieve) ->
        if (true == sieve) || (false == sieve)
          $scope.n_selected_VMs = if sieve then VMs.length else 0
          selected_VMs[VM.$UUID] = sieve for VM in VMs
          return

        n = 0

        matcher = make_matcher sieve
        ++n for VM in VMs when (selected_VMs[VM.$UUID] = matcher VM)

        $scope.n_selected_VMs = n

      $scope.updateVMSelection = (UUID) ->
        if selected_VMs[UUID]
          ++$scope.n_selected_VMs
        else
          --$scope.n_selected_VMs
