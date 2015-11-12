import angular from 'angular'
import forEach from 'lodash.foreach'
import prettyCron from 'prettycron'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import view from './view'

// ====================================================================

export default angular.module('backup.management', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('backup.management', {
      url: '/management',
      controller: 'ManagementCtrl as ctrl',
      template: view
    })
  })
  .controller('ManagementCtrl', function ($scope, $state, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter) {
    const mapJobKeyToState = {
      'rollingSnapshot': 'rollingsnapshot',
      'rollingBackup': 'backup',
      'disasterRecovery': 'disasterrecovery'
    }

    const mapJobKeyToJobDisplay = {
      'rollingSnapshot': 'Rolling Snapshot',
      'rollingBackup': 'Backup',
      'disasterRecovery': 'Disaster Recovery'
    }

    this.currentLogPage = 1
    this.logPageSize = 10

    const refreshSchedules = () => {
      xo.schedule.getAll()
      .then(schedules => this.schedules = schedules)
      xo.scheduler.getScheduleTable()
      .then(table => this.scheduleTable = table)
    }

    const getLogs = () => {
      xo.logs.get('jobs').then(logs => {
        const viewLogs = {}

        forEach(logs, (log, logKey) => {
          const data = log.data
          const [time] = logKey.split(':')

          if (data.event === 'job.start') {
            viewLogs[logKey] = {
              logKey,
              jobId: data.jobId,
              key: data.key,
              userId: data.userId,
              start: time,
              calls: {},
              time
            }
          } else {
            const runJobId = data.runJobId

            if (data.event === 'job.end') {
              const entry = viewLogs[runJobId]

              if (data.error) {
                entry.error = data.error
              }

              entry.end = time
              entry.duration = time - entry.start
              entry.status = 'Terminated'
            } else if (data.event === 'jobCall.start') {
              viewLogs[runJobId].calls[logKey] = {
                callKey: logKey,
                params: resolveParams(data.params),
                time
              }
            } else if (data.event === 'jobCall.end') {
              const call = viewLogs[runJobId].calls[data.runCallId]

              if (data.error) {
                call.error = data.error
                viewLogs[runJobId].hasErrors = true
              } else {
                call.returnedValue = data.returnedValue
              }
            }
          }
        })

        forEach(viewLogs, log => {
          if (log.end === undefined) {
            log.status = 'In progress'
          }
        })

        this.logs = viewLogs
      })
    }

    const resolveParams = params => {
      for (let key in params) {
        if (key === 'id') {
          const xoObject = xoApi.get(params[key])
          if (xoObject) {
            params[xoObject.type] = xoObject.name_label
            delete params[key]
          }
        }
      }
      return params
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
      refreshJobs().then(refreshSchedules)
      getLogs()
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
      .finally(() => { this.working[id] = false })
      .then(refreshSchedules)
    }
    this.disable = id => {
      this.working[id] = true
      return xo.scheduler.disable(id)
      .finally(() => { this.working[id] = false })
      .then(refreshSchedules)
    }
    this.resolveJobKey = schedule => mapJobKeyToState[this.jobs[schedule.job].key]
    this.displayJobKey = schedule => mapJobKeyToJobDisplay[this.jobs[schedule.job].key]
    this.displayLogKey = log => mapJobKeyToJobDisplay[log.key]

    this.collectionLength = col => Object.keys(col).length
    this.working = {}
  })

  // A module exports its name.
  .name
