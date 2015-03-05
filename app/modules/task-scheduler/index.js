import angular from 'angular'
import later from 'later'
import scheduler from 'scheduler'
import uiRouter from 'angular-ui-router'

later.date.localTime()

import job from './job'
import schedule from './schedule'

import view from './view'

export default angular.module('taskScheduler', [
  uiRouter,
  scheduler,

  job,
  schedule
])
  .config(function ($stateProvider) {
    $stateProvider.state('taskscheduler', {
      abstract: true,
      data: {
        requireAdmin: true
      },
      template: view,
      url: '/taskscheduler'
    })

    // Redirect to default sub-state.
    $stateProvider.state('taskscheduler.index', {
      url: '',
      controller: function ($state) {
        $state.go('taskscheduler.job')
      }
    })
  })

  .name
