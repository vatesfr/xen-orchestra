import angular from 'angular'
import uiRouter from 'angular-ui-router'

import pkg from '../../../package'

// ===================================================================

export default angular.module('xoWebApp.about', [
  uiRouter
])
  .config(function ($stateProvider) {
    $stateProvider.state('about', {
      url: '/about',
      controller: 'AboutCtrl',
      template: require('./view')
    })
  })
  .controller('AboutCtrl', function ($scope, xo) {
    xo.system.getServerVersion().then(version =>
      $scope.serverVersion = version
    )
    $scope.pkg = pkg
  })
  // A module exports its name.
  .name
