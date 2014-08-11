'use strict';

//====================================================================

/* global angular:false */
require('angular');
require('angular-ui-router');

//====================================================================

module.exports = angular.module('xoWebApp.list', [
  'ui.router',
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
;
