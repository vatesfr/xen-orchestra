import angular from 'angular';
import uiRouter from 'angular-ui-router';

import acls from './acls';

import view from './view';

export default angular.module('admin', [
  uiRouter,

  acls,
])
  .config(function ($stateProvider) {
    $stateProvider.state('admin', {
      abstract: true,
      template: view,
      url: '/admin',
    });

    // Redirect to default sub-state.
    $stateProvider.state('admin.index', {
      url: '',
      controller: function ($state) {
        $state.go('admin.acls');
      }
    });
  })
  .name
;
