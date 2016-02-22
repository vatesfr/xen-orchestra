import angular from 'angular'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import later from 'later'
import prettyCron from 'prettycron'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

later.date.localTime()

import view from './view'

// ====================================================================

export default angular.module('backup.continuousReplication', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('backup.continuousReplication', {
      url: '/continuous-replication/:id',
      controller: 'ContinuousReplicationCtrl as ctrl',
      template: view
    })
  })
  .controller('ContinuousReplicationCtrl', function ($scope, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter, bytesToSizeFilter) {
    const JOBKEY = 'continuousReplication'

    this.ready = false

    this.running = {}
    this.comesForEditing = $stateParams.id
    this.scheduleApi = {}
    this.formData = {}

    const refreshSchedules = () => xo.schedule.getAll()
      .then(schedules => {
        const s = {}
        forEach(schedules, schedule => {
          this.jobs && this.jobs[schedule.job] && this.jobs[schedule.job].key === JOBKEY && (s[schedule.id] = schedule)
        })
        this.schedules = s
      })

    const refreshJobs = () => xo.job.getAll()
      .then(jobs => {
        const j = {}
        forEach(jobs, job => {
          j[job.id] = job
        })
        this.jobs = j
      })

    const refresh = () => refreshJobs().then(refreshSchedules)
    const getReady = () => refresh().then(() => this.ready = true)
    getReady()

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
        const vm = find(vms, vm => vm.id === value.vm)
        vm && selectedVms.push(vm)
      })
      const tag = job.paramsVector.items[0].values[0].tag
      const selectedSr = xoApi.get(job.paramsVector.items[0].values[0].sr)
      const _reportWhen = job.paramsVector.items[0].values[0]._reportWhen
      const cronPattern = schedule.cron

      this.resetData()
      // const formData = this.formData
      this.formData.selectedVms = selectedVms
      this.formData.tag = tag
      this.formData.selectedSr = selectedSr
      this.formData.scheduleId = schedule.id
      this.formData._reportWhen = _reportWhen
      this.scheduleApi.setCron(cronPattern)
    }

    this.save = (id, vms, tag, sr, cron, enabled, _reportWhen) => {
      if (!vms.length) {
        notify.warning({
          title: 'No Vms selected',
          message: 'Choose VMs to copy'
        })
        return
      }

      const _save = (id === undefined) ? saveNew(vms, tag, sr, cron, enabled, _reportWhen) : save(id, vms, tag, sr, cron, _reportWhen)
      return _save
      .then(() => {
        notify.info({
          title: 'Continuous Replication',
          message: 'Job schedule successfuly saved'
        })
        this.resetData()
      })
      .finally(refresh)
    }

    const save = (id, vms, tag, sr, cron, _reportWhen) => {
      const schedule = this.schedules[id]
      const job = this.jobs[schedule.job]
      const values = []
      forEach(vms, vm => {
        values.push({vm: vm.id, tag, sr: sr.id, _reportWhen})
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

    const saveNew = (vms, tag, sr, cron, enabled, _reportWhen) => {
      const values = []
      forEach(vms, vm => {
        values.push({vm: vm.id, tag, sr: sr.id, _reportWhen})
      })
      const job = {
        type: 'call',
        key: JOBKEY,
        method: 'vm.deltaCopy',
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

    this.inTargetPool = vm => vm.$poolId === (this.formData.selectedSr && this.formData.selectedSr.$poolId)

    this.resetData = () => {
      this.formData.allRunning = false
      this.formData.allHalted = false
      this.formData.selectedVms = []
      this.formData.scheduleId = undefined
      this.formData.tag = undefined
      this.formData.selectedSr = undefined
      this.formData.enabled = false
      this.formData._reportWhen = undefined
      this.scheduleApi && this.scheduleApi.resetData && this.scheduleApi.resetData()
    }

    this.collectionLength = col => Object.keys(col).length
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
