'use strict';

//====================================================================

/* global angular:false */
require('angular');
require('angular-ui-router');

var pkg = require('../../../package');

//====================================================================

module.exports = angular.module('xoWebApp.about', [
  'ui.router',
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
;
