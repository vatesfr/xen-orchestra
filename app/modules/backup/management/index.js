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
      'rollingBackup': 'backup'
    }

    const mapJobKeyToJobDisplay = {
      'rollingSnapshot': 'Rolling Snapshot',
      'rollingBackup': 'Backup'
    }

    const refreshSchedules = () => {
      xo.schedule.getAll()
      .then(schedules => this.schedules = schedules)
      xo.scheduler.getScheduleTable()
      .then(table => this.scheduleTable = table)
    }

    const getLogs = () => {
      xo.logs.get('jobs').then(logs => {
        const formLogs = {}

        forEach(logs, (log, logKey) => {
          const data = log.data

          if (data.event === 'job.start') {
            const [ start ] = logKey.split(':')

            formLogs[logKey] = {
              jobId: data.jobId,
              key: (data.key.match(/Snapshot$/) !== null) ? 'Rolling Snapshot' : 'Backup',
              userId: data.userId,
              start,
              calls: {}
            }
          } else {
            const runJobId = data.runJobId

            if (data.event === 'job.end') {
              const [ end ] = logKey.split(':')
              const job = formLogs[runJobId]

              if (data.error) {
                job.error = data.error
              }

              job.end = end
              job.duration = end - job.start
              job.status = 'Terminated'
            } else if (data.event === 'jobCall.start') {
              formLogs[runJobId].calls[logKey] = {
                params: data.params
              }
            } else if (data.event === 'jobCall.end') {
              const call = formLogs[runJobId].calls[data.runCallId]

              if (data.error) {
                call.error = data.error
              } else {
                call.returnedValue = data.returnedValue
              }
            }
          }
        })

        console.log(formLogs)

        forEach(formLogs, log => {
          if (log.end === undefined) {
            log.status = 'In progress'
          }
        })

        this.logs = formLogs
      })
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
    getLogs()

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

    this.collectionLength = col => Object.keys(col).length
    this.working = {}
  })

  // A module exports its name.
  .name
