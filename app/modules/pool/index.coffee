angular = require 'angular'

#=====================================================================

module.exports = angular.module 'xoWebApp.pool', [
  require 'angular-ui-router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'pools_view',
      url: '/pools/:id'
      controller: 'PoolCtrl'
      template: require './view'
  .controller 'PoolCtrl', ($scope, $stateParams, xoApi, xo) ->
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

      $scope.patchPool = ($files, id) ->
        file = $files[0]
        xo.pool.patch id
        .then ({ $sendTo: url }) ->
          return $upload.http {
            method: 'POST'
            url
            data: file
          }
          .progress throttle(
            (event) ->
              percentage = (100 * event.loaded / event.total)|0

              notify.info
                title: 'Upload patch'
                message: "#{percentage}%"
            6e3
          )
        .then (result) ->
          throw result.status if result.status isnt 200
          notify.info
            title: 'Upload patch'
            message: 'Success'

  # A module exports its name.
  .name
