import angular from 'angular'
import Bluebird from 'bluebird'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import prettyCron from 'prettycron'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
Bluebird.longStackTraces()

import view from './view'

// ====================================================================

const JOB_KEY = 'genericTask'

export default angular.module('xoWebApp.taskscheduler.schedule', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('taskscheduler.schedule', {
      url: '/schedule/:id',
      controller: 'ScheduleCtrl as ctrl',
      template: view
    })
  })

  .controller('ScheduleCtrl', function (xo, xoApi, notify, $stateParams) {
    this.scheduleApi = {}
    this.formData = {}
    this.ready = false
    this.running = {}
    let comesForEditing = $stateParams.id

    this.reset = () => {
      this.formData.editedScheduleId = undefined
      this.formData.scheduleName = undefined
      this.formData.selectedJob = undefined
      this.formData.enabled = false
      this.scheduleApi && this.scheduleApi.resetData && this.scheduleApi.resetData()
    }

    this.reset()

    const refreshJobs = () => xo.job.getAll().then(jobs => {
      const j = {}
      forEach(jobs, job => {
        if (job.key === JOB_KEY) {
          j[job.id] = job
        }
      })
      this.jobs = j
    })

    const refreshSchedules = () => xo.schedule.getAll().then(schedules => {
      const s = {}
      forEach(schedules, schedule => {
        if (this.jobs && this.jobs[schedule.job] && (this.jobs[schedule.job].key === JOB_KEY)) {
          s[schedule.id] = schedule
        }
      })
      this.schedules = s
    })

    const refresh = () => refreshJobs().then(refreshSchedules)
    const getReady = () => refresh().then(() => this.ready = true)
    getReady().then(() => {
      if (comesForEditing) {
        this.edit(comesForEditing)
        comesForEditing = undefined
      }
    })

    const saveNew = (name, job, cron, enabled) => xo.schedule.create(job.id, cron, enabled, name)
    const save = (id, name, job, cron) => xo.schedule.set(id, job.id, cron, undefined, name)

    this.save = (id, name, job, cron, enabled) => {
      const saved = (id !== undefined) ? save(id, name, job, cron) : saveNew(name, job, cron, enabled)
      return saved
      .then(() => this.reset())
      .finally(refresh)
    }

    this.edit = id => {
      this.reset()
      const schedule = this.schedules[id]
      if (schedule) {
        this.formData.editedScheduleId = schedule.id
        this.formData.scheduleName = schedule.name
        this.formData.selectedJob = find(this.jobs, job => job.id = schedule.job)
        this.scheduleApi.setCron(schedule.cron)
      }
    }

    this.delete = (id) => xo.schedule.delete(id).then(refresh).then(() => {
      if (id === this.formData.editedScheduleId) {
        this.reset()
      }
    })

    this.run = schedule => {
      this.running[schedule.id] = true
      notify.info({
        title: 'Run Job',
        message: 'One shot running started. See overview for logs.'
      })
      const id = schedule.job
      return xo.job.runSequence([id]).finally(() => delete this.running[schedule.id])
    }

    this.prettyCron = prettyCron.toString.bind(prettyCron)
  })

  // A module exports its name.
  .name
