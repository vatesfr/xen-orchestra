import ActionButton from 'action-button'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import { error } from 'notification'
import Icon from 'icon'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Toggle } from 'form'
import { SelectPlainObject } from '../helpers'

import {
  createSchedule,
  deleteSchedule,
  subscribeJobs,
  subscribeSchedules,
  updateSchedule
} from 'xo'

const JOB_KEY = 'genericTask'

export default class Schedules extends Component {
  constructor (props) {
    super(props)
    this.state = {
      action: undefined,
      actions: undefined,
      job: undefined,
      jobs: undefined,
      cron: '* * * * *'
    }
    this.loaded = new Promise((resolve, reject) => {
      this._resolveLoaded = resolve
    })
      .then(() => {
        const { id } = this.props
        if (id) {
          this._edit(id)
        }
      })
  }

  componentWillMount () {
    const unsubscribeJobs = subscribeJobs(jobs => {
      const j = {}
      for (const id in jobs) {
        const job = jobs[id]
        if (job && (job.key === JOB_KEY)) {
          const _job = {...job}
          _job.label = `${_job.name} - ${_job.method} (${_job.id})`
          j[job.id] = _job
        }
      }
      this.setState({jobs: j})
    })

    const unsubscribeSchedules = subscribeSchedules(schedules => {
      const s = {}
      const { jobs } = this.state
      if (isEmpty(jobs)) {
        return
      }
      for (const id in schedules) {
        const schedule = schedules[id]
        const scheduleJob = find(jobs, job => job.id === schedule.job)
        if (scheduleJob && scheduleJob.key === JOB_KEY) {
          s[id] = schedule
        }
        this.setState({schedules: s}, this._resolveLoaded)
      }
    })

    this.componentWillUnmount = () => {
      unsubscribeJobs()
      unsubscribeSchedules()
    }
  }

  _handleSubmit = () => {
    const {name, job, enabled} = this.refs
    console.log(job)
    const { cron, schedule } = this.state
    let save
    if (schedule) {
      console.log('JOB', job, job.value)
      schedule.job = job.value.id
      schedule.cron = cron
      schedule.name = name.value
      save = updateSchedule(schedule)
    } else {
      save = createSchedule(job.value.id, cron, enabled.value, name.value)
    }
    return save.then(this._reset).catch(err => error('Save Schedule', err.message || String(err)))
  }

  _edit = id => {
    const { schedules } = this.state
    const schedule = find(schedules, schedule => schedule.id === id)
    if (!schedule) {
      error('Schedule edition', 'This schedule was not found, or may not longer exists.')
      return
    }

    const {name, job, scheduler} = this.refs
    name.value = schedule.name
    job.value = schedule.job
    scheduler.value = schedule.cron
    this.setState({
      schedule
    })
  }

  _reset = () => {
    this.setState({
      schedule: undefined
    }, () => {
      const {name, job, enabled, scheduler} = this.refs
      name.value = ''
      enabled.value = false
      job.value = undefined
      scheduler.value = undefined
    })
  }

  _updateCronPattern = cron => {
    this.setState({
      cron
    })
  }

  render () {
    const {
      cron,
      jobs,
      schedule,
      schedules
    } = this.state
    return <div>
      <h1>Schedules</h1>
      <form id='newScheduleForm'>
        <div className='form-group'>
          <input type='text' ref='name' className='form-control' placeholder='Name of your schedule' required />
        </div>
        <div className='form-group'>
          <SelectPlainObject ref='job' options={map(jobs)} optionKey='id' placeholder='Select a Job' />
        </div>
        {!schedule &&
          <div className='form-group'>
            <label>Enable immediately after creation</label>
            {' '}
            <Toggle ref='enabled' />
          </div>
        }
      </form>
      <fieldset>
        <Scheduler ref='scheduler' onChange={this._updateCronPattern} />
        <SchedulePreview cron={cron} />
      </fieldset>
      <br />
      <div className='form-group'>
        {schedule && <p className='text-warning'>You are editing Schedule {schedule.name}({schedule.id}). Saving will override previous schedule state.</p>}
        <ActionButton form='newScheduleForm' handler={this._handleSubmit} icon='save' btnStyle='primary'>Save</ActionButton>
        {' '}
        <button type='button' className='btn btn-default' onClick={this._reset}>Reset</button>
      </div>
      <table className='table'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Job</th>
            <th>Scheduling</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isEmpty(schedules) && <tr><td><em>No schedules found</em></td></tr>}
          {map(schedules, schedule => <tr key={schedule.id}>
            <td>
              <span>{schedule.name} <span className='text-muted'>({schedule.id})</span></span>
            </td>
            <td>{jobs[schedule.job] && <span>{jobs[schedule.job].name} - {jobs[schedule.job].method} <span className='text-muted'>({schedule.job})</span></span>}</td>
            <td>{schedule.cron}</td>
            <td>
              <button type='button' className='btn btn-primary' onClick={() => this._edit(schedule.id)}><Icon icon='edit' /></button>
              {' '}
              <button type='button' className='btn btn-danger' onClick={() => deleteSchedule(schedule)}><Icon icon='delete' /></button>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  }
}
