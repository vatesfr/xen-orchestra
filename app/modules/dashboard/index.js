import angular from 'angular'
import uiRouter from 'angular-ui-router'

import dataviz from './dataviz'
import filter from 'lodash.filter'
import health from './health'
import stats from './stats'
import overview from './overview'

import view from './view'

export default angular.module('dashboard', [
  uiRouter,
  dataviz,
  health,
  stats,
  overview
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard', {
      abstract: true,
      data: {
        requireAdmin: true
      },
      template: view,
      url: '/dashboard'
    })

    // Redirect to default sub-state.
    $stateProvider.state('dashboard.index', {
      url: '',
      controller: function ($state) {
        $state.go('dashboard.overview')
      }
    })
  })

  .filter('underStat', () => {
    let isUnderStat = object => object.type === 'host' || object.type === 'VM'
    return objects => filter(objects, isUnderStat)
  })

  .name
