'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', (
    $scope, $stateParams
    xoApi, xoObjects
    sizeToBytesFilter, bytesToSizeFilter
  ) ->
    {get} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        VM = $scope.VM = get $stateParams.uuid

        return unless VM?

        # For the edition of this VM.
        $scope.memorySize = bytesToSizeFilter VM.memory.size

        # build VDI list of this VM
        $scope.VDIs = []
        for VBD in VM.$VBDs
          VDI = get (get VBD)?.VDI
          $scope.VDIs.push VDI if VDI?
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
      ## TODO: confirmation message. Too dangerous for now, but it works
      #xoApi.call 'xapi.vm.destroy', {id: UUID}

    $scope.saveVM = ($data) ->
      {VM} = $scope

      xoApi.call 'vm.set', {
        id: VM.UUID
        CPUs: if $data.CPUs isnt VM.CPUs.number then +$data.CPUs
        memory: sizeToBytesFilter $data.memory
        name_label: $data.name_label
        name_description: $data.name_description
      }

    # VDI
    selected = $scope.selectedVDIs = {}

    $scope.newVDIs = []

    $scope.addVDI = ->
      $scope.newVDIs.push {
        # Fake (unique) identifier needed by Angular.JS
        id: Math.random()
      }
    ## TODO: Use Angular XEditable Row
