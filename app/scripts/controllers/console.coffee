'use strict'

angular.module('xoWebApp')
  .controller 'ConsoleCtrl', ($scope, $stateParams, xoApi, xo) ->
    {id} = $stateParams
    {get} = xo
    push = Array::push.apply.bind Array::push
    merge = do ->
      (args...) ->
        result = []
        for arg in args
          push result, arg if arg?
        result

    $scope.$watch(
      -> xo.revision
      ->
        unless xoApi.user
          $scope.consoleUrl = ''
          $scope.VDIs = []
          return

        VM = $scope.VM = xo.get id
        return unless VM? and VM.power_state is 'Running'

        pool = get VM.poolRef
        return unless pool

        $scope.consoleUrl = do ->
          for console in VM.consoles
            if console.protocol is 'rfb'
              return "#{console.location}&session_id=#{pool.$sessionId}"
          ''

        host = get VM.$container # host because the VM is running.
        return unless host

        # FIXME: We should filter on connected SRs (PBDs)!
        SRs = get (merge host.SRs, pool.SRs)
        $scope.VDIs = do ->
          VDIs = []
          for SR in SRs
            push VDIs, SR.VDIs if SR.content_type is 'iso'
          get VDIs

        cdDrive = do ->
          return VBD for VBD in (get VM.$VBDs) when VBD.is_cd_drive
          null

        $scope.mountedIso =
          if cdDrive and cdDrive.VDI and (VDI = get cdDrive.VDI)
            VDI.UUID
          else
            ''
    )

    $scope.eject = ->
      xo.vm.ejectCd id
    $scope.insert = (disc_id) ->
      xo.vm.insertCd id, disc_id, true
