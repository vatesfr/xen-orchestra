'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.host = xoObjects.byUUIDs[$stateParams.uuid]
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
