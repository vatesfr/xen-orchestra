angular = require 'angular'

#=====================================================================

module.exports = angular.module 'xoWebApp.deleteVms', [
  require 'angular-ui-bootstrap'

  require '../../services.coffee'
]
  .controller 'DeleteVmsCtrl', ($scope, $modalInstance, xo, VMsIds) ->
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
  .service 'deleteVmsModal', ($modal, xo) ->
    return (ids) ->
      modal = $modal.open
        controller: 'DeleteVmsCtrl'
        template: require './view'
        resolve: VMsIds: -> ids

      return modal.result.then (toDelete) ->
        for [id, deleteDisks] in toDelete
          xo.vm.delete id, deleteDisks
  # A module exports its name.
  .name
