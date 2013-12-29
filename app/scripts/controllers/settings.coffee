'use strict'

angular.module('xoWebApp')
  .controller 'SettingsCtrl', ($scope, xoApi) ->
    $scope.permissions = [
      {
        label: 'Admin'
        value: 'admin'
      }
      {
        label: 'Write'
        value: 'write'
      }
      {
        label: 'Read'
        value: 'read'
      }
      {
        label: 'None'
        value: 'none'
      }
    ]

    xoApi.call('user.getAll').then (users) ->
      $scope.users = users

    xoApi.call('server.getAll').then (servers) ->
      $scope.servers = servers
