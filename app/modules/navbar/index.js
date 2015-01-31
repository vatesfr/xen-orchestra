import angular from 'angular';
import uiRouter from 'angular-ui-router';

import xoServices from 'xo-services';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.navbar', [
  uiRouter,

  xoServices,
])
  .controller('NavbarCtrl', function ($scope, $state, xoApi) {
    // TODO: It would make sense to inject xoApi in the scope.
    $scope.$watch(() => xoApi.status, function (status) {
      $scope.status = status;
    });
    $scope.$watch(() => xoApi.user, function (user) {
      $scope.user = user;
    })
    $scope.logIn = xoApi.logIn
    $scope.logOut = function () {
      xoApi.logOut();
      $state.go('login');
    };

    // When a searched is entered, we must switch to the list view if
    // necessary.
    $scope.ensureListView = function () {
      $state.go('list');
    };
  })
  .directive('navbar', function () {
    return {
      restrict: 'E',
      controller: 'NavbarCtrl as navbar',
      template: view,
      replace: true,
    };
  })

  // A module exports its name.
  .name
;
