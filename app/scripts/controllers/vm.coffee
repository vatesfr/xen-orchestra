'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.VM = xoObjects.byUUIDs[$stateParams.uuid]
    )

    $scope.select2Options =
      'multiple': true
      'simple_tags': true
      'tags': []

    $scope.startVM = (UUID) ->
      console.log "Start VM #{UUID}"

      xoApi.call 'xapi.vm.start', {id: UUID}

    $scope.start_onVM = (UUID) ->
      console.log "Start VM #{UUID} on Host #{Host.UUID}"

    $scope.stopVM = (UUID) ->
      console.log "Stop VM #{UUID}"

      xoApi.call 'xapi.vm.shutdown', {id: UUID}

    $scope.force_stopVM = (UUID) ->
      console.log "Force Stop VM #{UUID}"

      xoApi.call 'xapi.vm.hard_shutdown', {id: UUID}

    $scope.rebootVM = (UUID) ->
      console.log "Reboot VM #{UUID}"

      xoApi.call 'xapi.vm.reboot', {id: UUID}

    $scope.force_rebootVM = (UUID) ->
      console.log "Reboot VM #{UUID}"

      xoApi.call 'xapi.vm.hard_reboot', {id: UUID}
