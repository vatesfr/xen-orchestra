import angular from 'angular';
import uiRouter from 'angular-ui-router';

import users from './users';

import view from './view';

export default angular.module('admin', [
  uiRouter,

  users,
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
        $state.go('admin.users');
      }
    });
  })
  .name
;
