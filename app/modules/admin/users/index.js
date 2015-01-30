import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import view from './view';

export default angular.module('admin.users', [
  uiRouter,
  uiSelect,
])
  .config(function ($stateProvider) {
    $stateProvider.state('admin.users', {
      url: '/users',
      template: view,
    });
  })
  .name
;

