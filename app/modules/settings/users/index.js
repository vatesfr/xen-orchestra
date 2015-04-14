import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('settings.users', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.users', {
      controller: 'SettingsUsers as ctrl',
      url: '/users',
      resolve: {
        users(xo) {
          return xo.acl.get();
        },
      },
      template: view,
    });
  })
  .controller('SettingsUsers', function ($scope, users, xoApi, xo) {
    this.users = users;
  })
  .name
;
