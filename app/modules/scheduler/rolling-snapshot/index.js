import angular from 'angular'
import assign from 'lodash.assign'
import find from 'lodash.find'
import indexOf from 'lodash.indexof'
import later from 'later'
import moment from 'moment'
import prettyCron from 'prettycron'
import remove from 'lodash.remove'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import forEach from 'lodash.foreach'

later.date.localTime()

import view from './view'

// ====================================================================

export default angular.module('scheduler.rollingSnapshot', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('scheduler.rollingsnapshot', {
      url: '/rollingsnapshot/:id',
      controller: 'RollingSnapshotCtrl as ctrl',
      template: view
    })
  })
  .controller('RollingSnapshotCtrl', function ($scope, $state, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter) {
    this.comesForEditing = $stateParams.id

    this.selectMinute = function (minute) {
      if (this.isSelectedMinute(minute)) {
        remove(this.formData.minSelect, v => String(v) === String(minute))
      } else {
        this.formData.minSelect.push(minute)
      }
    }

    this.isSelectedMinute = function (minute) {
      return indexOf(this.formData.minSelect, minute) > -1 || indexOf(this.formData.minSelect, String(minute)) > -1
    }

    this.selectHour = function (hour) {
      if (this.isSelectedHour(hour)) {
        remove(this.formData.hourSelect, v => String(v) === String(hour))
      } else {
        this.formData.hourSelect.push(hour)
      }
    }

    this.isSelectedHour = function (hour) {
      return indexOf(this.formData.hourSelect, hour) > -1 || indexOf(this.formData.hourSelect, String(hour)) > -1
    }

    this.selectDay = function (day) {
      if (this.isSelectedDay(day)) {
        remove(this.formData.daySelect, v => String(v) === String(day))
      } else {
        this.formData.daySelect.push(day)
      }
    }

    this.isSelectedDay = function (day) {
      return indexOf(this.formData.daySelect, day) > -1 || indexOf(this.formData.daySelect, String(day)) > -1
    }

    this.selectMonth = function (month) {
      if (this.isSelectedMonth(month)) {
        remove(this.formData.monthSelect, v => String(v) === String(month))
      } else {
        this.formData.monthSelect.push(month)
      }
    }

    this.isSelectedMonth = function (month) {
      return indexOf(this.formData.monthSelect, month) > -1 || indexOf(this.formData.monthSelect, String(month)) > -1
    }

    this.selectDayWeek = function (dayWeek) {
      if (this.isSelectedDayWeek(dayWeek)) {
        remove(this.formData.dayWeekSelect, v => String(v) === String(dayWeek))
      } else {
        this.formData.dayWeekSelect.push(dayWeek)
      }
    }

    this.isSelectedDayWeek = function (dayWeek) {
      return indexOf(this.formData.dayWeekSelect, dayWeek) > -1 || indexOf(this.formData.dayWeekSelect, String(dayWeek)) > -1
    }

    this.noMinutePlan = function (set = false) {
      if (!set) {
        // The last part (after &&) of this expression is reliable because we maintain the minSelect array with lodash.remove
        return this.formData.min === 'select' && this.formData.minSelect.length === 1 && String(this.formData.minSelect[0]) === '0'
      } else {
        this.formData.minSelect = [0]
        this.formData.min = 'select'
        return true
      }
    }

    this.noHourPlan = function (set = false) {
      if (!set) {
        // The last part (after &&) of this expression is reliable because we maintain the hourSelect array with lodash.remove
        return this.formData.hour === 'select' && this.formData.hourSelect.length === 1 && String(this.formData.hourSelect[0]) === '0'
      } else {
        this.formData.hourSelect = [0]
        this.formData.hour = 'select'
        return true
      }
    }

    this.update = function () {
      const d = this.formData
      const i = (d.min === 'all' && '*') ||
        (d.min === 'range' && ('*/' + d.minRange)) ||
        (d.min === 'select' && d.minSelect.join(',')) ||
        '*'
      const h = (d.hour === 'all' && '*') ||
        (d.hour === 'range' && ('*/' + d.hourRange)) ||
        (d.hour === 'select' && d.hourSelect.join(',')) ||
        '*'
      const dm = (d.day === 'all' && '*') ||
        (d.day === 'select' && d.daySelect.join(',')) ||
        '*'
      const m = (d.month === 'all' && '*') ||
        (d.month === 'select' && d.monthSelect.join(',')) ||
        '*'
      const dw = (d.dayWeek === 'all' && '*') ||
        (d.dayWeek === 'select' && d.dayWeekSelect.join(',')) ||
        '*'
      this.formData.cronPattern = i + ' ' + h + ' ' + dm + ' ' + m + ' ' + dw

      const tabState = {
        min: {
          all: d.min === 'all',
          range: d.min === 'range',
          select: d.min === 'select'
        },
        hour: {
          all: d.hour === 'all',
          range: d.hour === 'range',
          select: d.hour === 'select'
        },
        day: {
          all: d.day === 'all',
          range: d.day === 'range',
          select: d.day === 'select'
        },
        month: {
          all: d.month === 'all',
          select: d.month === 'select'
        },
        dayWeek: {
          all: d.dayWeek === 'all',
          select: d.dayWeek === 'select'
        }
      }
      this.tabs = tabState
      this.summarize()
    }

    this.summarize = function () {
      const schedule = later.parse.cron(this.formData.cronPattern)
      const occurences = later.schedule(schedule).next(25)
      this.formData.summary = []
      forEach(occurences, occurence => {
        this.formData.summary.push(moment(occurence).format('LLLL'))
      })
    }

    const cronToFormData = (data, cron) => {
      const d = Object.create(null)
      const cronItems = cron.split(' ')

      if (cronItems[0] === '*') {
        d.min = 'all'
      } else if (cronItems[0].indexOf('/') !== -1) {
        d.min = 'range'
        const [, range] = cronItems[0].split('/')
        d.minRange = range
      } else {
        d.min = 'select'
        d.minSelect = cronItems[0].split(',')
      }

      if (cronItems[1] === '*') {
        d.hour = 'all'
      } else if (cronItems[1].indexOf('/') !== -1) {
        d.hour = 'range'
        const [, range] = cronItems[1].split('/')
        d.hourRange = range
      } else {
        d.hour = 'select'
        d.hourSelect = cronItems[1].split(',')
      }

      if (cronItems[2] === '*') {
        d.day = 'all'
      } else {
        d.day = 'select'
        d.daySelect = cronItems[2].split(',')
      }

      if (cronItems[3] === '*') {
        d.month = 'all'
      } else {
        d.month = 'select'
        d.monthSelect = cronItems[3].split(',')
      }

      if (cronItems[4] === '*') {
        d.dayWeek = 'all'
      } else {
        d.dayWeek = 'select'
        d.dayWeekSelect = cronItems[4].split(',')
      }

      assign(data, d)
    }

    this.prettyCron = prettyCron.toString.bind(prettyCron)

    const refreshSchedules = () => {
      return xo.schedule.getAll()
      .then(schedules => {
        const s = {}
        forEach(schedules, schedule => s[schedule.id] = schedule)
        this.schedules = s
      })
    }

    const refreshJobs = () => {
      return xo.job.getAll()
      .then(jobs => {
        const j = {}
        forEach(jobs, job => j[job.id] = job)
        this.jobs = j
      })
    }

    const interval = $interval(() => {
      refreshSchedules()
      refreshJobs()
    }, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

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

    this.toggleAllRunning = (toggle) => toggleState(toggle, 'Running')
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
      const cronPattern = schedule.cron

      this.resetFormData()
      const formData = this.formData
      formData.selectedVms = selectedVms
      formData.tag = tag
      formData.depth = depth
      formData.scheduleId = schedule.id
      cronToFormData(formData, cronPattern)
      this.formData = formData
      this.update()
    }

    this.save = (id, vms, tag, depth, cron, enabled) => {
      if (!vms.length) {
        notify.warning({
          title: 'No Vms selected',
          message: 'Choose VMs to snapshot'
        })
        return
      }
      const _save = (id === undefined) ? saveNew(vms, tag, depth, cron, enabled) : save(id, vms, tag, depth, cron)
      return _save
      .then(() => {
        notify.info({
          title: 'Rolling snapshot',
          message: 'Job schedule successfuly saved'
        })
        this.resetFormData()
        this.update()
      })
      .finally(() => {
        refreshJobs()
        refreshSchedules()
      })
    }

    const save = (id, vms, tag, depth, cron) => {
      const schedule = this.schedules[id]
      const job = this.jobs[schedule.job]
      const values = []
      forEach(vms, vm => {
        values.push({
          id: vm.id,
          tag,
          depth
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

    const saveNew = (vms, tag, depth, cron, enabled) => {
      const values = []
      forEach(vms, vm => {
        values.push({
          id: vm.id,
          tag,
          depth
        })
      })
      const job = {
        type: 'call',
        key: 'rollingSnapshot',
        method: 'vm.rollingSnapshot',
        paramsVector: {
          type: 'crossProduct',
          items: [
            {
              type: 'set',
              values
            }
          ]
        }
      }
      return xo.job.create(job)
      .then(jobId => {
        return xo.schedule.create(jobId, cron, enabled)
      })
    }

    this.delete = schedule => {
      let jobId = schedule.job
      xo.schedule.delete(schedule.id)
      .then(() => xo.job.delete(jobId))
      .finally(() => {
        refreshJobs()
        refreshSchedules()
      })
    }

    this.collectionLength = col => Object.keys(col).length

    let i, j
    this.minutes = []
    for (i = 0; i < 6; i++) {
      this.minutes[i] = []
      for (j = 0; j < 10; j++) {
        this.minutes[i].push(10 * i + j)
      }
    }
    this.hours = []
    for (i = 0; i < 3; i++) {
      this.hours[i] = []
      for (j = 0; j < 8; j++) {
        this.hours[i].push(8 * i + j)
      }
    }
    this.days = []
    for (i = 0; i < 4; i++) {
      this.days[i] = []
      for (j = 1; j < 8; j++) {
        this.days[i].push(7 * i + j)
      }
    }
    this.days.push([29, 30, 31])

    this.months = [
      [
        {v: 1, l: 'Jan'},
        {v: 2, l: 'Feb'},
        {v: 3, l: 'Mar'},
        {v: 4, l: 'Apr'},
        {v: 5, l: 'May'},
        {v: 6, l: 'Jun'}
      ],
      [
        {v: 7, l: 'Jul'},
        {v: 8, l: 'Aug'},
        {v: 9, l: 'Sep'},
        {v: 10, l: 'Oct'},
        {v: 11, l: 'Nov'},
        {v: 12, l: 'Dec'}
      ]
    ]

    this.dayWeeks = [
      {v: 0, l: 'Sun'},
      {v: 1, l: 'Mon'},
      {v: 2, l: 'Tue'},
      {v: 3, l: 'Wed'},
      {v: 4, l: 'Thu'},
      {v: 5, l: 'Fri'},
      {v: 6, l: 'Sat'}
    ]

    this.resetFormData = () => this.formData = {
      minRange: 5,
      hourRange: 2,
      minSelect: [0],
      hourSelect: [],
      daySelect: [],
      monthSelect: [],
      dayWeekSelect: [],
      min: 'select',
      hour: 'all',
      day: 'all',
      month: 'all',
      dayWeek: 'all',
      cronPattern: '* * * * *',
      summary: [],
      allRunning: false,
      allHalted: false,
      selectedVms: [],
      scheduleId: undefined,
      tag: undefined,
      depth: undefined,
      enabled: false,
      previewLimit: 0
    }

    if (!this.comesForEditing) {
      refreshSchedules()
      refreshJobs()
      this.resetFormData()
      this.update()
    } else {
      refreshJobs()
      .then(() => refreshSchedules())
      .then(() => {
        this.edit(this.schedules[this.comesForEditing])
        delete this.comesForEditing
      })
    }
    this.objects = xoApi.all
  })

  // A module exports its name.
  .name
