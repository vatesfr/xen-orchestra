'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $stateParams, xoApi, xo) ->
    $scope.$watch(
      -> xo.revision
      ->
        host = $scope.host = xo.get $stateParams.id
        return unless host?

        $scope.pool = xo.get host.poolRef

        SRsToPBDs = $scope.SRsToPBDs = Object.create null
        for PBD in host.$PBDs
          PBD = xo.get PBD

          # If this PBD is unknown, just skips it.
          continue unless PBD

          SRsToPBDs[PBD.SR] = PBD
    )

    $scope.removeMessage = xo.message.delete

    $scope.removeTask = xo.task.delete

    $scope.disconnectPBD = xo.pbd.disconnect
    $scope.removePBD = xo.pbd.delete

    $scope.new_sr = xo.pool.new_sr
    $scope.pool_removeHost = xo.host.detach
    $scope.rebootHost = xo.host.restart
    $scope.restartToolStack = xo.host.restartToolStack
    $scope.shutdownHost = xo.host.stop

    $scope.saveHost = ($data) ->
      {host} = $scope
      {name_label, name_description, enabled} = $data

      $data = {
        id: host.UUID
      }
      if name_label isnt host.name_label
        $data.name_label = name_label
      if name_description isnt host.name_description
        $data.name_description = name_description
      if enabled isnt host.enabled
        $data.enabled = host.enabled

      xoApi.call 'host.set', $data
