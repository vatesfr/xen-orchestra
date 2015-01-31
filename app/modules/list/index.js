import angular from 'angular';
import uiRouter from 'angular-ui-router';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.list', [
  uiRouter,
])
  .config(function ($stateProvider) {
    $stateProvider.state('list', {
      url: '/list',
      controller: 'ListCtrl as list',
      template: view,
    });
  })
  .controller('ListCtrl', function (xo) {
    this.byTypes = xo.byTypes;
  })

  // A module exports its name.
  .name
;
