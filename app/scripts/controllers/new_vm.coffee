'use strict'

angular.module('xoWebApp')
  .controller 'NewVmCtrl', ($scope, $stateParams, xoObjects) ->
    {get} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        container = $scope.container = get $stateParams.container

        # If the container was not found, no need to continue.
        return unless container?

        $scope.templates = if container.type is 'pool'
          container.templates
        else
          # TODO: checks for the pool's existence.
          pool = get container.poolRef

          # Returns its templates.
          pool.templates
    )

