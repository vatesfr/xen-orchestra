import angular from 'angular';
import uiRouter from 'angular-ui-router';

import acls from './acls';
import servers from './servers';
import update from './update';
import users from './users';

import view from './view';

export default angular.module('settings', [
  uiRouter,

  acls,
  servers,
  update,
  users,
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings', {
      abstract: true,
      template: view,
      url: '/settings',
    });

    // Redirect to default sub-state.
    $stateProvider.state('settings.index', {
      url: '',
      controller: function ($state) {
        $state.go('settings.servers');
      }
    });
  })
  .name
;
