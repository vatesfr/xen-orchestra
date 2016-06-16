import _ from 'messages'
import ActionRowButton from 'action-row-button'
import ActionToggle from 'action-toggle'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import LogList from '../../logs'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Link } from 'react-router'

import {
  Card,
  CardHeader,
  CardBlock
} from 'card'

import {
  deleteBackupSchedule,
  disableSchedule,
  enableSchedule,
  runJob,
  subscribeJobs,
  subscribeSchedules,
  subscribeScheduleTable
} from 'xo'

import { getJobValues } from '../helpers'

// ===================================================================

const jobKeyToLabel = {
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot')
}

// ===================================================================

export default class Overview extends Component {
  constructor (props) {
    super(props)
    this.state = {
      schedules: [],
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
      // Get only backup jobs.
      schedules = filter(schedules, schedule => {
        const job = this._getScheduleJob(schedule)
        return job && jobKeyToLabel[job.key]
      })

      this.setState({
        schedules: orderBy(schedules, schedule => +schedule.id.split(':')[1], ['desc'])
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

  _getJobLabel (job = {}) {
    return jobKeyToLabel[job.key] || _('unknownSchedule')
  }

  _getScheduleTag (schedule, job = {}) {
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

  _getScheduleToggle (schedule) {
    const { id } = schedule

    return (
      <ActionToggle
        value={this.state.scheduleTable[id]}
        handler={this._updateScheduleState}
        handlerParam={id}
        size='small'
      />
    )
  }

  _updateScheduleState = id => {
    const enabled = this.state.scheduleTable[id]
    const method = enabled ? disableSchedule : enableSchedule

    return method(id)
  }

  render () {
    const {
      schedules
    } = this.state

    return (
      <div>
        <Card>
          <CardHeader>
            <h5><Icon icon='schedule' /> Schedules</h5>
          </CardHeader>
          <CardBlock>
            {schedules.length ? (
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
                  {map(schedules, (schedule, key) => {
                    const job = this._getScheduleJob(schedule)

                    return (
                      <tr key={key}>
                        <td>{this._getJobLabel(job)}</td>
                        <td>{this._getScheduleTag(schedule, job)}</td>
                        <td className='hidden-xs-down'>{schedule.cron}</td>
                        <td>
                          {this._getScheduleToggle(schedule)}
                          <fieldset className='pull-xs-right'>
                            <Link className='btn btn-sm btn-primary m-r-1' to={`/backup/${job.id}/edit`}>
                              <Icon icon='edit' />
                            </Link>
                            <ButtonGroup>
                              <ActionRowButton
                                icon='delete'
                                btnStyle='danger'
                                handler={deleteBackupSchedule}
                                handlerParam={schedule}
                              />
                              <ActionRowButton
                                icon='run-schedule'
                                btnStyle='warning'
                                handler={runJob}
                                handlerParam={schedule.job}
                              />
                            </ButtonGroup>
                          </fieldset>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : <p>{_('noScheduledJobs')}</p>}
          </CardBlock>
        </Card>
        <LogList jobKeys={Object.keys(jobKeyToLabel)} />
      </div>
    )
  }
}
