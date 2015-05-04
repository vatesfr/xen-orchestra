import angular from 'angular';
import filter from 'lodash.filter';
import uiRouter from 'angular-ui-router';

import updater from '../updater';
import xoServices from 'xo-services';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.navbar', [
  uiRouter,

  updater,
  xoServices,
])
  .controller('NavbarCtrl', function ($state, xoApi, xo, $scope, updater) {
    this.updater = updater
    // TODO: It would make sense to inject xoApi in the scope.
    Object.defineProperties(this, {
      status: {
        get: () => xoApi.status,
      },
      user: {
        get: () => xoApi.user,
      },
    });
    this.logIn = xoApi.logIn;
    this.logOut = function () {
      xoApi.logOut();
      $state.go('login');
    };

    // When a searched is entered, we must switch to the list view if
    // necessary.
    this.ensureListView = function () {
      $state.go('list');
    };

    const ALIVE_STATUS = {
      cancelling: true,
      pending: true,
    };
    let {canAccess} = xo;
    let sieve = (task) => ALIVE_STATUS[task.status] && canAccess(task.$host);
    $scope.$watchCollection(() => xoApi.byTypes.task, (tasks) => {
      this.tasks = filter(tasks, sieve);
    });
  })
  .directive('navbar', function () {
    return {
      restrict: 'E',
      controller: 'NavbarCtrl as navbar',
      template: view,
      scope: {},
    };
  })

  // A module exports its name.
  .name
;
