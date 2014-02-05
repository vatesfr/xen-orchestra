'use strict'

angular.module('xoWebApp')
  .controller 'ConsoleCtrl', ($scope, $stateParams, xo) ->
    $scope.$watch(
      -> xo.revision
      ->
        VM = $scope.VM = xo.get $stateParams.id

        # If the VM or its pool cannot be found, stop here.
        return unless VM? and (pool = xo.get VM.poolRef)?

        $scope.consoleUrl = do ->
          for console in VM.consoles
            if console.protocol is 'rfb'
              return "#{console.location}&session_id=#{pool.$sessionId}"
          ''
    )
