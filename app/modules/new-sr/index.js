import angular from 'angular';
import uiRouter from 'angular-ui-router';

import xoServices from 'xo-services';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.newSr', [
  uiRouter,

  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('SRs_new', {
      url: '/srs/new/:container',
      controller: 'NewSrCtrl as newSr',
      template: view,
    });
  })
  .controller('NewSrCtrl', function ($scope, $stateParams, xo) {
    $scope.$watch(() => xo.revision, () => {
      this.container = xo.get $stateParams.container;
    });
  })

  // A module exports its name.
  .name
;
