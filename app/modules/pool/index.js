import angular from 'angular'
import forEach from 'lodash.foreach'
import uiRouter from 'angular-ui-router'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.pool', [
  uiRouter
])
  .config(function ($stateProvider) {
    $stateProvider.state('pools_view', {
      url: '/pools/:id',
      controller: 'PoolCtrl',
      template: view
    })
  })
  .controller('PoolCtrl', function ($scope, $stateParams, xoApi, xo, modal) {
    $scope.$watch(() => xoApi.get($stateParams.id), function (pool) {
      $scope.pool = pool
    })

    $scope.currentLogPage = 1

    $scope.savePool = function ($data) {
      let {pool} = $scope
      let {name_label, name_description} = $data

      $data = {
        id: pool.id
      }
      if (name_label !== pool.name_label) {
        $data.name_label = name_label
      }
      if (name_description !== pool.name_description) {
        $data.name_description = name_description
      }

      xoApi.call('pool.set', $data)
    }

    $scope.deleteAllLog = function () {
      return modal.confirm({
        title: 'Log deletion',
        message: 'Are you sure you want to delete all the logs?'
      }).then(function () {
        // TODO: return all promises.
        forEach($scope.pool.messages, function (message) {
          xo.log.delete(message.id)
          console.log('Remove log', message.id)
        })
      })
    }

    $scope.deleteLog = function (id) {
      console.log('Remove log', id)
      return xo.log.delete(id)
    }

    // $scope.patchPool = ($files, id) ->
    //   file = $files[0]
    //   xo.pool.patch id
    //   .then ({ $sendTo: url }) ->
    //     return $upload.http {
    //       method: 'POST'
    //       url
    //       data: file
    //     }
    //     .progress throttle(
    //       (event) ->
    //         percentage = (100 * event.loaded / event.total)|0

    //         notify.info
    //           title: 'Upload patch'
    //           message: "#{percentage}%"
    //       6e3
    //     )
    //   .then (result) ->
    //     throw result.status if result.status isnt 200
    //     notify.info
    //       title: 'Upload patch'
    //       message: 'Success'

  })

  // A module exports its name.
  .name
