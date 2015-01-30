import angular from 'angular';
import uiRouter from 'angular-ui-router';

import view from './view';

//====================================================================

module.exports = angular.module('xoWebApp.login', [
  uiRouter,
])
  .config(function ($stateProvider) {
    $stateProvider.state('login', {
      url: '/login',
      controller: 'LoginCtrl',
      template: view,
    });
  })
  .controller('LoginCtrl', function($scope, $state, $rootScope, xoApi) {
    var toState, toStateParams;
    {
      let state = $rootScope._login;
      if (state && (state = state.state)) {
        toState = state.name;
        toStateParams = state.stateParams;
        delete $rootScope._login;
      } else {
        toState = 'home';
      }
    }

    $scope.$watch(() => xoApi.user, function (user) {
      // When the user is logged in, go the wanted view, fallbacks on
      // the home view if necessary.
      if (user) {
        $state.go(toState, toStateParams).catch(function () {
          $state.go('home');
        });
      }
    });

    Object.defineProperties($scope, {
      user: {
        get() {
          return xoApi.user;
        },
      },
      status: {
        get() {
          return xoApi.status;
        }
      },
    });
    $scope.logIn = xoApi.logIn;
  })

  // A module exports its name.
  .name
;
