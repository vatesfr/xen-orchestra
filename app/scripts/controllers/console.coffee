'use strict'

angular.module('xoWebApp')
  .controller 'ConsoleCtrl', ($scope, $stateParams, xoObjects) ->
    {get} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        VM = $scope.VM = get $stateParams.uuid

        # If the VM or its pool cannot be found, stop here.
        return unless VM? and (pool = get VM.poolRef)?

        $scope.consoleUrl = do ->
          for console in VM.consoles
            if console.protocol is 'rfb'
              return "#{console.location}&session_id=#{pool.$sessionId}"
          ''
    )
