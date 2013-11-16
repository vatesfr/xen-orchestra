'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, objects) ->
    $scope.objects = objects.all
    $scope.byUUIDs = objects.byUUIDs
