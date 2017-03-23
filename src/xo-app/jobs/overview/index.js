import _ from 'intl'
import ActionRowButton from 'action-row-button'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import Link from 'link'
import LogList from '../../logs'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions } from 'utils'
import { Container } from 'grid'
import { createSelector } from 'selectors'
import {
  Card,
  CardHeader,
  CardBlock
} from 'card'
import {
  deleteSchedule,
  disableSchedule,
  enableSchedule,
  runJob,
  subscribeJobs,
  subscribeSchedules,
  subscribeScheduleTable,
  subscribeUsers
} from 'xo'

// ===================================================================

const jobKeyToLabel = {
  genericTask: _('customJob')
}

// ===================================================================

@addSubscriptions({
  users: subscribeUsers
})
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
    return `${job.name} - ${job.method} (${job.id.slice(4, 8)})`
  }

  _getScheduleLabel (schedule) {
    return `${schedule.name} (${schedule.id.slice(4, 8)})`
  }

  _getScheduleToggle (schedule) {
    const { id } = schedule

    return (
      <StateButton
        disabledLabel={_('jobStateDisabled')}
        disabledHandler={enableSchedule}
        disabledTooltip={_('logIndicationToEnable')}

        enabledLabel={_('jobStateEnabled')}
        enabledHandler={disableSchedule}
        enabledTooltip={_('logIndicationToDisable')}

        handlerParam={id}
        state={this.state.scheduleTable[id]}
      />
    )
  }

  _getIsScheduleUserMissing = createSelector(
    () => this.state.schedules,
    () => this.props.users,
    (schedules, users) => {
      const isScheduleUserMissing = {}

      forEach(schedules, schedule => {
        isScheduleUserMissing[schedule.id] = !!find(users, user => user.id === this._getScheduleJob(schedule).userId)
      })

      return isScheduleUserMissing
    }
  )

  render () {
    const {
      schedules
    } = this.state

    const isScheduleUserMissing = this._getIsScheduleUserMissing()

    return (process.env.XOA_PLAN > 3
      ? <Container>
        <Card>
          <CardHeader>
            <Icon icon='schedule' /> {_('backupSchedules')}
          </CardHeader>
          <CardBlock>
            {schedules.length ? (
              <table className='table'>
                <thead className='thead-default'>
                  <tr>
                    <th>{_('schedule')}</th>
                    <th>{_('job')}</th>
                    <th className='hidden-xs-down'>{_('jobScheduling')}</th>
                    <th>{_('jobState')}</th>
                    <th className='text-xs-right'>{_('jobAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {map(schedules, (schedule, key) => {
                    const job = this._getScheduleJob(schedule)

                    return (
                      <tr key={key}>
                        <td>
                          {this._getScheduleLabel(schedule)}
                          <Link className='btn btn-sm btn-primary ml-1' to={`/jobs/schedules/${schedule.id}/edit`}>
                            <Icon icon='edit' />
                          </Link>
                        </td>
                        <td>
                          {this._getJobLabel(job)}
                          <Link className='btn btn-sm btn-primary ml-1' to={`/jobs/${job.id}/edit`}>
                            <Icon icon='edit' />
                          </Link>
                        </td>
                        <td className='hidden-xs-down'>{schedule.cron}</td>
                        <td>{this._getScheduleToggle(schedule)}</td>
                        <td className='text-xs-right'>
                          <fieldset>
                            {!isScheduleUserMissing[schedule.id] && <Tooltip content={_('jobUserNotFound')}><Icon className='mr-1' icon='error' /></Tooltip>}
                            <ActionRowButton
                              icon='delete'
                              btnStyle='danger'
                              handler={deleteSchedule}
                              handlerParam={schedule}
                            />
                            <ActionRowButton
                              disabled={!isScheduleUserMissing[schedule.id]}
                              icon='run-schedule'
                              btnStyle='warning'
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
            ) : <p>{_('noScheduledJobs')}</p>}
          </CardBlock>
        </Card>
        <LogList jobKeys={Object.keys(jobKeyToLabel)} />
      </Container>
      : <Container><Upgrade place='health' available={4} /></Container>
    )
  }
}
