'use strict'

angular.module('xoWebApp')
  .controller 'SettingsCtrl', ($scope, xoApi) ->
    $scope.permissions = [
      {
        label: 'None'
        value: 'none'
      }
      {
        label: 'Read'
        value: 'read'
      }
      {
        label: 'Write'
        value: 'write'
      }
      {
        label: 'Admin'
        value: 'admin'
      }
    ]

    xoApi.call('user.getAll').then (users) ->
      $scope.users = users

    xoApi.call('server.getAll').then (servers) ->
      $scope.servers = servers
