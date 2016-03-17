import angular from 'angular'
import filter from 'lodash.filter'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import map from 'lodash.map'
import prettyCron from 'prettycron'
import size from 'lodash.size'
import trim from 'lodash.trim'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import { parse } from 'xo-remote-parser'

import view from './view'

// ====================================================================

export default angular.module('backup.backup', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('backup.backup', {
      url: '/backup/:id',
      controller: 'BackupCtrl as ctrl',
      template: view
    })
  })
  .controller('BackupCtrl', function ($scope, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter) {
    const JOBKEY = 'rollingBackup'

    this.ready = false

    this.running = {}
    this.comesForEditing = $stateParams.id
    this.scheduleApi = {}
    this.formData = {}

    const refreshRemotes = () => {
      const selectRemoteId = this.formData.remote && this.formData.remote.id
      return xo.remote.getAll()
      .then(remotes => {
        const r = {}
        forEach(remotes, remote => {
          remote = parse(remote)
          r[remote.id] = remote
        })
        this.remotes = r
        if (selectRemoteId) {
          this.formData.remote = this.remotes[selectRemoteId]
        }
      })
    }

    const refreshSchedules = () => {
      return xo.schedule.getAll()
      .then(schedules => {
        const s = {}
        forEach(schedules, schedule => {
          this.jobs && this.jobs[schedule.job] && this.jobs[schedule.job].key === JOBKEY && (s[schedule.id] = schedule)
        })
        this.schedules = s
      })
    }

    const refreshJobs = () => {
      return xo.job.getAll()
      .then(jobs => {
        const j = {}
        forEach(jobs, job => {
          j[job.id] = job
        })
        this.jobs = j
      })
    }

    const refresh = () => refreshRemotes().then(refreshJobs).then(refreshSchedules)

    this.getReady = () => refresh().then(() => this.ready = true)
    this.getReady()

    const interval = $interval(refresh, 5e3)
    $scope.$on('$destroy', () => $interval.cancel(interval))

    const toggleState = (toggle, state) => {
      const selectedVms = this.formData.selectedVms.slice()
      if (toggle) {
        const vms = filterFilter(selectHighLevelFilter(this.objects), {type: 'VM'})
        forEach(vms, vm => {
          if (vm.power_state === state) {
            (selectedVms.indexOf(vm) === -1) && selectedVms.push(vm)
          }
        })
        this.formData.selectedVms = selectedVms
      } else {
        const keptVms = []
        for (let index in this.formData.selectedVms) {
          if (this.formData.selectedVms[index].power_state !== state) {
            keptVms.push(this.formData.selectedVms[index])
          }
        }
        this.formData.selectedVms = keptVms
      }
    }

    this.toggleAllRunning = toggle => toggleState(toggle, 'Running')
    this.toggleAllHalted = toggle => toggleState(toggle, 'Halted')

    this.edit = schedule => {
      const vms = filterFilter(selectHighLevelFilter(this.objects), {type: 'VM'})
      const job = this.jobs[schedule.job]
      const selectedVms = []
      forEach(job.paramsVector.items[0].values, value => {
        const vm = find(vms, vm => vm.id === value.id)
        vm && selectedVms.push(vm)
      })
      const tag = job.paramsVector.items[0].values[0].tag
      const depth = job.paramsVector.items[0].values[0].depth
      const _reportWhen = job.paramsVector.items[0].values[0]._reportWhen
      const cronPattern = schedule.cron
      const remoteId = job.paramsVector.items[0].values[0].remoteId
      const onlyMetadata = job.paramsVector.items[0].values[0].onlyMetadata || false
      let compress = job.paramsVector.items[0].values[0].compress
      if (compress === undefined) {
        compress = true // Default value
      }

      this.resetData()
      this.formData.selectedVms = selectedVms
      this.formData.tag = tag
      this.formData.depth = depth
      this.formData.scheduleId = schedule.id
      this.formData._reportWhen = _reportWhen
      this.formData.remote = this.remotes[remoteId]
      this.formData.disableCompression = !compress
      this.formData.onlyMetadata = onlyMetadata
      this.scheduleApi.setCron(cronPattern)
    }

    this.save = (id, vms, remoteId, tag, depth, cron, enabled, onlyMetadata, disableCompression, _reportWhen) => {
      if (!vms.length) {
        notify.warning({
          title: 'No Vms selected',
          message: 'Choose VMs to backup'
        })
        return
      }
      const _save = (id === undefined) ? saveNew(vms, remoteId, tag, depth, cron, enabled, onlyMetadata, disableCompression, _reportWhen) : save(id, vms, remoteId, tag, depth, cron, onlyMetadata, disableCompression, _reportWhen)
      return _save
      .then(() => {
        notify.info({
          title: 'Backup',
          message: 'Job schedule successfuly saved'
        })
        this.resetData()
      })
      .finally(refresh)
    }

    const save = (id, vms, remoteId, tag, depth, cron, onlyMetadata, disableCompression, _reportWhen) => {
      const schedule = this.schedules[id]
      const job = this.jobs[schedule.job]
      const values = []
      forEach(vms, vm => {
        values.push({
          id: vm.id,
          remoteId,
          tag,
          depth,
          onlyMetadata,
          compress: !disableCompression,
          _reportWhen
        })
      })
      job.paramsVector.items[0].values = values
      return xo.job.set(job)
      .then(response => {
        if (response) {
          return xo.schedule.set(schedule.id, undefined, cron, undefined)
        } else {
          notify.error({
            title: 'Update schedule',
            message: 'Job updating failed'
          })
          throw new Error('Job updating failed')
        }
      })
    }

    const saveNew = (vms, remoteId, tag, depth, cron, enabled, onlyMetadata, disableCompression, _reportWhen) => {
      const values = []
      forEach(vms, vm => {
        values.push({
          id: vm.id,
          remoteId,
          tag,
          depth,
          onlyMetadata,
          compress: !disableCompression,
          _reportWhen
        })
      })
      const job = {
        type: 'call',
        key: JOBKEY,
        method: 'vm.rollingBackup',
        paramsVector: {
          type: 'crossProduct',
          items: [{
            type: 'set',
            values
          }]
        }
      }
      return xo.job.create(job)
      .then(jobId => xo.schedule.create(jobId, cron, enabled))
    }

    this.delete = schedule => {
      let jobId = schedule.job
      return xo.schedule.delete(schedule.id)
      .then(() => xo.job.delete(jobId))
      .finally(() => {
        if (this.formData.scheduleId === schedule.id) {
          this.resetData()
        }
        refresh()
      })
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

    this.sanitizePath = (...paths) => (paths[0] && paths[0].charAt(0) === '/' && '/' || '') + filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')

    this.resetData = () => {
      this.formData.allRunning = false
      this.formData.allHalted = false
      this.formData.selectedVms = []
      this.formData.scheduleId = undefined
      this.formData.tag = undefined
      this.formData.path = undefined
      this.formData.depth = undefined
      this.formData.enabled = false
      this.formData._reportWhen = undefined
      this.formData.remote = undefined
      this.formData.onlyMetadata = false
      this.formData.disableCompression = false
      this.scheduleApi && this.scheduleApi.resetData && this.scheduleApi.resetData()
    }

    this.size = size
    this.prettyCron = prettyCron.toString.bind(prettyCron)

    if (!this.comesForEditing) {
      refresh()
    } else {
      refresh()
      .then(() => {
        this.edit(this.schedules[this.comesForEditing])
        delete this.comesForEditing
      })
    }
    this.resetData()
    this.objects = xoApi.all
  })

  // A module exports its name.
  .name
