'use strict';

//====================================================================

/* global angular:false */
require('angular');
require('angular-ui-router');

//====================================================================

module.exports = angular.module('xoWebApp.about', [
  'ui.router',
])
  .config(function ($stateProvider) {
    $stateProvider.state('about', {
      url: '/about',
      template: require('./view'),
    });
  })
;
