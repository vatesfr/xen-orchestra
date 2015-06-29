import angular from 'angular'
import assign from 'lodash.assign'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import indexOf from 'lodash.indexof'
import later from 'later'
import moment from 'moment'
import prettyCron from 'prettycron'
import remove from 'lodash.remove'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import view from './view'

// ====================================================================

export default angular.module('scheduler.management', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('scheduler.management', {
      url: '/management',
      controller: 'ManagementCtrl as ctrl',
      template: view
    })
  })
  .controller('ManagementCtrl', function ($scope, $state, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter) {
    const refreshSchedules = () => {
      xo.schedule.getAll()
      .then(schedules => {
        const s = {}
        forEach(schedules, schedule => s[schedule.id] = schedule)
        this.schedules = s
      })
      xo.scheduler.getScheduleTable()
      .then(table => this.scheduleTable = table)
    }

    this.prettyCron = prettyCron.toString.bind(prettyCron)

    const refreshJobs = () => {
      xo.job.getAll()
      .then(jobs => {
        const j = {}
        forEach(jobs, job => j[job.id] = job)
        this.jobs = j
      })
    }
    refreshSchedules()
    refreshJobs()

    const interval = $interval(() => {
      refreshSchedules()
      refreshJobs()
    }, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.enable = id => {
      this.working[id] = true
      return xo.scheduler.enable(id)
      .finally(() => {this.working[id] = false})
      .then(refreshSchedules)
    }
    this.disable = id => {
      this.working[id] = true
      return xo.scheduler.disable(id)
      .finally(() => {this.working[id] = false})
      .then(refreshSchedules)
    }
    this.collectionLength = col => Object.keys(col).length
    this.working = {}
  })

  // A module exports its name.
  .name
