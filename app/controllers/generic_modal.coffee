'use strict'

angular.module('xoWebApp')
  .controller 'GenericModalCtrl', ($scope, $modalInstance, options) ->
    $scope.title = options.title
    $scope.message = options.message

    $scope.yesButtonLabel = options.yesButtonLabel ? 'Ok'
    $scope.noButtonLabel = options.noButtonLabel
