'use strict';

//====================================================================

var angular = require('angular');

var pkg = require('../../../package');

//====================================================================

module.exports = angular.module('xoWebApp.about', [
  require('angular-ui-router'),
])
  .config(function ($stateProvider) {
    $stateProvider.state('about', {
      url: '/about',
      controller: 'AboutCtrl',
      template: require('./view'),
    });
  })
  .controller('AboutCtrl', function ($scope) {
    $scope.pkg = pkg;
  })
  // A module exports its name.
  .name
;
