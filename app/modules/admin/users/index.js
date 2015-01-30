import angular from 'angular';
import uiRouter from 'angular-ui-router';

import view from './view';

export default angular.module('admin.users', [
  uiRouter,
])
  .config(function ($stateProvider) {
    $stateProvider.state('admin.users', {
      url: '/users',
      template: view,
    });
  })
  .name
;

