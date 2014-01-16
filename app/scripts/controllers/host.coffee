'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    {byUUIDs, byRefs} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        host = $scope.host = byUUIDs[$stateParams.uuid]
        return unless host?
        $scope.pool = byRefs[host.poolRef]
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
