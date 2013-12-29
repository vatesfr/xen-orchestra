'use strict'

angular.module('xoWebApp')
  .controller 'SettingsCtrl', ($scope, xoApi) ->
    xoApi.call('server.getAll').then (servers) ->
      $scope.servers = servers
