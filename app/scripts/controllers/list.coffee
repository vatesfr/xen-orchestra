'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, $location, objects) ->
    $scope.objects = objects.all
    $scope.byUUIDs = objects.byUUIDs

    $scope.goTo = (path) -> $location.path path
