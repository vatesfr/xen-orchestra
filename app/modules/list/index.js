'use strict';

//====================================================================

var angular = require('angular');

//====================================================================

module.exports = angular.module('xoWebApp.list', [
  require('angular-ui-router'),
])
  .config(function ($stateProvider) {
    $stateProvider.state('list', {
      url: '/list',
      controller: 'ListCtrl',
      template: require('./view'),
    });
  })
  .controller('ListCtrl', function ($scope, xo) {
    $scope.byTypes = xo.byTypes;
  })

  // A module exports its name.
  .name
;
