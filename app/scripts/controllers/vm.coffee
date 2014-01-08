'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    {byUUIDs} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        VM = $scope.VM = xoObjects.byUUIDs[$stateParams.uuid]

        # build VDI list of this VM
        return unless VM?
        $scope.VDIs = []
        for VBD in VM.$VBDs
          $scope.VDIs.push byUUIDs[VBD].VDI
    )

    # AngularUI select2 component settings
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

    $scope.destroyVM = (UUID) ->
      console.log "Destroy VM #{UUID}"

      xoApi.call 'xapi.vm.destroy', {id: UUID}


    # VDI
    selected = $scope.selectedVDIs = {}

    $scope.newVDIs = []

    $scope.addVDI = ->
      $scope.newVDIs.push {
        # Fake (unique) identifier needed by Angular.JS
        id: Math.random()
      }
    ## TODO: Use Angular XEditable Row
