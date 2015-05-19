import angular from 'angular'
import uiRouter from 'angular-ui-router'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.login', [
  uiRouter
])
  .config(function ($stateProvider) {
    $stateProvider.state('login', {
      url: '/login',
      controller: 'LoginCtrl',
      template: view
    })
  })
  .controller('LoginCtrl', function ($scope, $state, $rootScope, xoApi, notify) {
    const {toState, toStateParams} = (function (login) {
      if (login) {
        delete $rootScope._login

        return {
          toState: login.state.name,
          toStateParams: login.stateParams
        }
      }

      return { toState: 'index' }
    })($rootScope._login)

    $scope.$watch(() => xoApi.user, function (user) {
      // When the user is logged in, go the wanted view, fallbacks on
      // the index view if necessary.
      if (user) {
        $state.go(toState, toStateParams).catch(function () {
          $state.go('index')
        })
      }
    })

    Object.defineProperties($scope, {
      user: {
        get () {
          return xoApi.user
        }
      },
      status: {
        get () {
          return xoApi.status
        }
      }
    })
    $scope.logIn = (...args) => {
      xoApi.logIn(...args).catch(error => {
        notify.warning({
          title: 'Authentication failed',
          message: error.message
        })
      })
    }
  })

  // A module exports its name.
  .name
