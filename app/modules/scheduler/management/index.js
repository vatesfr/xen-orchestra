import angular from 'angular'
import forEach from 'lodash.foreach'
import prettyCron from 'prettycron'
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
    const mapJobKeyToState = {
      'rollingSnapshot': 'rollingsnapshot',
      'rollingBackup': 'backup'
    }

    const refreshSchedules = () => {
      xo.schedule.getAll()
      .then(schedules => this.schedules = schedules)
      xo.scheduler.getScheduleTable()
      .then(table => this.scheduleTable = table)
    }

    this.prettyCron = prettyCron.toString.bind(prettyCron)

    const refreshJobs = () => {
      return xo.job.getAll()
      .then(jobs => {
        const j = {}
        forEach(jobs, job => j[job.id] = job)
        this.jobs = j
      })
    }

    const refresh = () => {
      return refreshJobs().then(refreshSchedules)
    }

    refresh()

    const interval = $interval(() => {
      refresh()
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
    this.resolveJobKey = schedule => {
      return mapJobKeyToState[this.jobs[schedule.job].key]
    }

    this.collectionLength = col => Object.keys(col).length
    this.working = {}
  })

  // A module exports its name.
  .name
