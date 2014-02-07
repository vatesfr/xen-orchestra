'use strict'

angular.module('xoWebApp')
  .controller 'DeleteVMsCtrl', ($scope, $modalInstance, xo, VMsIds) ->
    $scope.$watch(
      -> xo.revision
      ->
        $scope.VMs = xo.get VMsIds
    )

    # Do disks have to be deleted for a given VM.
    disks = $scope.disks = {}
    do ->
      disks[id] = true for id in VMsIds

    $scope.delete = ->
      $modalInstance.close ([id, disks[id]] for id in VMsIds)
