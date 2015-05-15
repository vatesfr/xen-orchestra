import angular from 'angular';
import uiRouter from 'angular-ui-router';

import dataviz from './dataviz';
import health from './health';
import overview from './overview';

import view from './view';

export default angular.module('dashboard', [
  uiRouter,

  dataviz,
  health,
  overview,
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard', {
      abstract: true,
      template: view,
      url: '/dashboard',
    });

    // Redirect to default sub-state.
    $stateProvider.state('dashboard.index', {
      url: '',
      controller: function ($state) {
        $state.go('dashboard.overview');
      }
    });
  })
  .name
;
