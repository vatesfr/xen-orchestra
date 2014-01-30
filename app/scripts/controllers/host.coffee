'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    {get} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        host = $scope.host = get $stateParams.uuid
        return unless host?

        $scope.pool = get host.poolRef

        SRsToPBDs = $scope.SRsToPBDs = Object.create null
        for PBD in host.$PBDs
          PBD = get PBD

          # If this PBD is unknown, just skips it.
          continue unless PBD

          SRsToPBDs[PBD.SR] = PBD
    )

    $scope.removeMessage = (UUID) ->
      console.log "Remove message #{UUID}"
      xoApi.call 'xapi.message.destroy', {id: UUID}

    $scope.removeTask = (UUID) ->
      console.log "Remove task #{UUID}"

    $scope.disconnectPBD = (UUID) ->
      console.log "Disconnect PBD #{UUID}"

    $scope.removePBD = (UUID) ->
      console.log "Remove PBD #{UUID}"
