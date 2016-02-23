import angular from 'angular'
import filter from 'lodash.filter'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import map from 'lodash.map'
import prettyCron from 'prettycron'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import parse from 'xo-remote-parser'

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
  .controller('ManagementCtrl', function (
    $interval,
    $scope,
    $state,
    $stateParams,
    filterFilter,
    modal,
    notify,
    selectHighLevelFilter,
    xo,
    xoApi
    ) {
    this.running = {}
    const mapJobKeyToState = {
      continuousReplication: 'continuousReplication',
      deltaBackup: 'deltaBackup',
      disasterRecovery: 'disasterrecovery',
      rollingBackup: 'backup',
      rollingSnapshot: 'rollingsnapshot',
      __none: 'index'
    }

    const mapJobKeyToJobDisplay = {
      continuousReplication: 'Continuous Replication',
      deltaBackup: 'Delta Backup',
      disasterRecovery: 'Disaster Recovery',
      rollingBackup: 'Backup',
      rollingSnapshot: 'Rolling Snapshot',
      __none: '[unknown]'
    }

    this.currentLogPage = 1
    this.logPageSize = 10

    const refreshSchedules = () => {
      xo.schedule.getAll()
      .then(schedules => {
        schedules = filter(schedules, schedule => this.jobs[schedule.job] && this.jobs[schedule.job].key in mapJobKeyToState)
        this.schedules = this.schedules ? map(schedules, schedule => {
          schedule.error = find(this.schedules, oldSchedule => schedule.id === oldSchedule.id).error
          return schedule
        }) : schedules
      })
      xo.scheduler.getScheduleTable()
      .then(table => this.scheduleTable = table)
      xo.remote.getAll()
      .then(remotes => {
        this.backUpRemotes = map(remotes, parse)
        forEach(this.schedules, schedule => {
          const jobRemote = this.jobs[schedule.job].paramsVector.items[0].values[0]
          const key = this.jobs[schedule.job].key
          // TODO: Why is the property either 'remote' or 'remoteId'?
          const remoteId = jobRemote.remoteId || jobRemote.remote
          const remote = find(remotes, remote => remote.id === remoteId)
          schedule.error = (!remote || !remote.enabled) && key !== 'continuousReplication' && key !== 'disasterRecovery' && key !== 'rollingSnapshot'
        })
      })
    }

    const getLogs = () => {
      xo.logs.get('jobs').then(logs => {
        const viewLogs = {}
        const logsToClear = []
        forEach(logs, (log, logKey) => {
          const data = log.data
          const [time] = logKey.split(':')
          if (data.event === 'job.start' && data.key in mapJobKeyToState) {
            logsToClear.push(logKey)
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
            const entry = viewLogs[runJobId]
            if (!entry) {
              return
            }
            logsToClear.push(logKey)
            if (data.event === 'job.end') {
              if (data.error) {
                entry.error = data.error
              }
              entry.end = time
              entry.duration = time - entry.start
              entry.status = 'Finished'
            } else if (data.event === 'jobCall.start') {
              entry.calls[logKey] = {
                callKey: logKey,
                params: resolveParams(data.params),
                method: data.method,
                time
              }
            } else if (data.event === 'jobCall.end') {
              const call = entry.calls[data.runCallId]

              if (data.error) {
                call.error = data.error
                entry.hasErrors = true
              } else {
                call.returnedValue = resolveReturn(data.returnedValue)
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
        this.logsToClear = logsToClear
      })
    }

    const resolveParams = params => {
      for (let key in params) {
        const xoObject = xoApi.get(params[key])
        if (xoObject) {
          const newKey = xoObject.type || key
          params[newKey] = xoObject.name_label || xoObject.name || params[key]
          newKey !== key && delete params[key]
        }
      }
      return params
    }

    const resolveReturn = returnValue => {
      const xoObject = xoApi.get(returnValue)
      let xoName = xoObject && (xoObject.name_label || xoObject.name)
      xoName && (xoName += xoObject.type && ` (${xoObject.type})` || '')
      returnValue = xoName || returnValue
      return returnValue
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

    this.clearLogs = () => {
      modal.confirm({
        title: 'Clear logs',
        message: 'Are you sure you want to delete all logs ?'
      })
      .then(() => xo.logs.delete('jobs', this.logsToClear))
    }

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
    this.run = schedule => {
      this.running[schedule.id] = true
      notify.info({
        title: 'Run Job',
        message: 'One shot running started. See overview for logs.'
      })
      const id = schedule.job
      return xo.job.runSequence([id]).finally(() => delete this.running[schedule.id])
    }
    this.resolveJobKey = schedule => mapJobKeyToState[this.jobs[schedule.job] && this.jobs[schedule.job].key || '__none']
    this.displayJobKey = schedule => mapJobKeyToJobDisplay[this.jobs[schedule.job] && this.jobs[schedule.job].key || '__none']
    this.displayLogKey = log => mapJobKeyToJobDisplay[log.key]
    this.resolveScheduleJobTag = schedule => this.jobs[schedule.job] && this.jobs[schedule.job].paramsVector && this.jobs[schedule.job].paramsVector.items[0].values[0].tag || schedule.id

    this.collectionLength = col => Object.keys(col).length
    this.working = {}
  })

  // A module exports its name.
  .name
