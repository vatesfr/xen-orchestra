import ActionButton from 'action-button'
import ActionToggle from 'action-toggle'
import Icon from 'icon'
import React, { Component } from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import sortBy from 'lodash/orderBy'

import {
  enableSchedule,
  disableSchedule,
  runJob,
  subscribeJobs,
  subscribeSchedules,
  subscribeScheduleTable
} from 'xo'

// ===================================================================

const jobKeyToLabel = {
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot')
}

const getJobValues = job => job.values || job.items

// ===================================================================

export default class Overview extends Component {
  constructor (props) {
    super(props)
    this.state = {
      scheduleTable: {}
    }
  }

  componentWillMount () {
    const unsubscribeJobs = subscribeJobs(jobs => {
      const obj = {}
      forEach(jobs, job => { obj[job.id] = job })

      this.setState({
        jobs: obj
      })
    })

    const unsubscribeSchedules = subscribeSchedules(schedules => {
      this.setState({
        schedules: sortBy(schedules, schedule => +schedule.id.split(':')[1])
      })
    })

    const unsubscribeScheduleTable = subscribeScheduleTable(scheduleTable => {
      this.setState({
        scheduleTable
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeJobs()
      unsubscribeSchedules()
      unsubscribeScheduleTable()
    }
  }

  _getScheduleJob (schedule) {
    const { jobs } = this.state || {}
    return jobs[schedule.job]
  }

  _getScheduleLabel (schedule) {
    const job = this._getScheduleJob(schedule) || {}
    return jobKeyToLabel[job.key] || _('unknownSchedule')
  }

  _getScheduleTag (schedule) {
    const job = this._getScheduleJob(schedule)

    try {
      const { paramsVector } = job
      const values = getJobValues(paramsVector)

      // Old versions of XenOrchestra uses values[0]
      return (
        getJobValues(values[0])[0].tag ||
        getJobValues(values[1])[0].tag
      )
    } catch (_) {}

    return schedule.id
  }

  _getScheduleState (schedule) {
    const state = this.state.scheduleTable[schedule.id]

    return (
      (state && <span className='label label-success'>enabled</span>) ||
      (state === false && <span className='label label-default'>disabled</span>) ||
      (<span className='label label-warning'>unknown</span>)
    )
  }

  _getScheduleToggle (schedule) {
    const { id } = schedule
    const enabled = this.state.scheduleTable[id]
    const method = enabled ? disableSchedule : enableSchedule

    return (
      <ActionToggle toggleOn={this.state.scheduleTable[schedule.id]} handler={() => method(id)} />
    )
  }

  render () {
    const { state } = this

    return (
      <div className='card'>
        <div className='card-header text-xs-center'>
          <h5><Icon icon='schedule' /> Schedules</h5>
        </div>
        <div>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('job')}</th>
                <th>{_('jobTag')}</th>
                <th className='hidden-xs-down'>{_('jobScheduling')}</th>
                <th>{_('jobState')}</th>
              </tr>
            </thead>
            <tbody>
              {map(state.schedules, (schedule, key) => {
                return (
                  <tr key={key}>
                    <td>{this._getScheduleLabel(schedule)}</td>
                    <td><a>{this._getScheduleTag(schedule)}</a></td>
                    <td className='hidden-xs-down'>{schedule.cron}</td>
                    <td>
                      {this._getScheduleState(schedule)}
                      <fieldset className='pull-xs-right'>
                        {this._getScheduleToggle(schedule)}
                        <ActionButton
                          className='btn btn-xs btn-warning m-l-1'
                          icon='run-schedule'
                          handler={runJob}
                          handlerParam={schedule.job}
                        />
                      </fieldset>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}
