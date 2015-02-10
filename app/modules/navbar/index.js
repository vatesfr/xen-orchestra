import angular from 'angular';
import uiRouter from 'angular-ui-router';

import xoServices from 'xo-services';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.navbar', [
  uiRouter,

  xoServices,
])
  .controller('NavbarCtrl', function ($state, xoApi, xo, $scope) {
    // TODO: It would make sense to inject xoApi in the scope.
    Object.defineProperties(this, {
      status: {
        get: () => xoApi.status,
      },
      user: {
        get: () => xoApi.user,
      },
      tasks: {
        get: () => xo.byTypes.task,
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

    $scope.$watchCollection(() => xo.byTypes.task, tasks => {
      var runningTasks = this.runningTasks = [];
      angular.forEach(tasks, (task) => {
        if (task.status === 'pending' || task.status === 'cancelling') {
          runningTasks.push(task);
        }
      });
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
