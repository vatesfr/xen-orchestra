module.exports = ($scope, $stateParams, xo) ->
  $scope.$watch(
    -> xo.revision
    ->
      $scope.container = xo.get $stateParams.container
  )

