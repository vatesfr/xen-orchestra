module.exports = ($scope, $stateParams, xoApi, xo) ->
  $scope.$watch(
    -> xo.revision
    -> $scope.pool = xo.get $stateParams.id
  )

  $scope.savePool = ($data) ->
    {pool} = $scope
    {name_label, name_description} = $data

    $data = {
      id: pool.UUID
    }
    if name_label isnt pool.name_label
      $data.name_label = name_label
    if name_description isnt pool.name_description
      $data.name_description = name_description

    xoApi.call 'pool.set', $data

  $scope.deleteLog = (id) ->
    console.log "Remove log #{id}"
    xo.log.delete id
