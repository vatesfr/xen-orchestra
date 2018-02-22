import _ from 'intl'
import Icon from 'icon'
import Link from 'link'
import LogList from '../../logs'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions } from 'utils'
import { Container } from 'grid'
import { createSelector } from 'selectors'
import { Card, CardHeader, CardBlock } from 'card'
import { filter, find, forEach, orderBy } from 'lodash'
import {
  deleteSchedule,
  deleteSchedules,
  disableSchedule,
  enableSchedule,
  runJob,
  subscribeJobs,
  subscribeSchedules,
  subscribeUsers,
} from 'xo'

// ===================================================================

const jobKeyToLabel = {
  genericTask: _('customJob'),
}

const COLUMNS = [
  {
    itemRenderer: schedule => {
      const { id } = schedule

      return (
        <div>
          <span>{`${schedule.name} (${id.slice(4, 8)})`}</span>
          <Link
            className='btn btn-sm btn-primary ml-1'
            to={`/jobs/schedules/${id}/edit`}
          >
            <Icon icon='edit' />
          </Link>
        </div>
      )
    },
    name: _('schedule'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: (schedule, userData) => {
      const job = userData.jobs[schedule.jobId]

      return (
        job !== undefined && (
          <div>
            <span>{`${job.name} - ${job.method} (${job.id.slice(4, 8)})`}</span>
            <Link
              className='btn btn-sm btn-primary ml-1'
              to={`/jobs/${job.id}/edit`}
            >
              <Icon icon='edit' />
            </Link>
          </div>
        )
      )
    },
    name: _('job'),
    sortCriteria: (schedule, userData) => {
      const job = userData.jobs[schedule.jobId]
      return job !== undefined && job.name
    },
  },
  {
    itemRenderer: schedule => schedule.cron,
    name: _('jobScheduling'),
  },
  {
    itemRenderer: schedule => (
      <StateButton
        disabledLabel={_('jobStateDisabled')}
        disabledHandler={enableSchedule}
        disabledTooltip={_('logIndicationToEnable')}
        enabledLabel={_('jobStateEnabled')}
        enabledHandler={disableSchedule}
        enabledTooltip={_('logIndicationToDisable')}
        handlerParam={schedule.id}
        state={schedule.enabled}
      />
    ),
    name: _('jobState'),
  },
  {
    itemRenderer: (schedule, userData) =>
      !userData.isScheduleUserMissing[schedule.id] && (
        <Tooltip content={_('jobUserNotFound')}>
          <Icon className='mr-1' icon='error' />
        </Tooltip>
      ),
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    disabled: (schedule, userData) =>
      !userData.isScheduleUserMissing[schedule.id],
    handler: schedule => runJob(schedule.jobId),
    icon: 'run-schedule',
    label: _('scheduleRun'),
    level: 'warning',
  },
]

const ACTIONS = [
  {
    handler: deleteSchedules,
    icon: 'delete',
    individualHandler: deleteSchedule,
    individualLabel: _('scheduleDelete'),
    label: _('deleteSelectedSchedules'),
    level: 'danger',
  },
]

// ===================================================================

@addSubscriptions({
  users: subscribeUsers,
})
export default class Overview extends Component {
  constructor (props) {
    super(props)
    this.state = {
      schedules: [],
    }
  }

  componentWillMount () {
    const unsubscribeJobs = subscribeJobs(jobs => {
      const obj = {}
      forEach(jobs, job => {
        obj[job.id] = job
      })

      this.setState({
        jobs: obj,
      })
    })

    const unsubscribeSchedules = subscribeSchedules(schedules => {
      // Get only backup jobs.
      schedules = filter(schedules, schedule => {
        const job = this._getScheduleJob(schedule)
        return job && jobKeyToLabel[job.key]
      })

      this.setState({
        schedules: orderBy(schedules, schedule => +schedule.id.split(':')[1], [
          'desc',
        ]),
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeJobs()
      unsubscribeSchedules()
    }
  }

  _getScheduleJob (schedule) {
    const { jobs } = this.state || {}
    return jobs[schedule.jobId]
  }

  _getIsScheduleUserMissing = createSelector(
    () => this.state.schedules,
    () => this.props.users,
    (schedules, users) => {
      const isScheduleUserMissing = {}

      forEach(schedules, schedule => {
        isScheduleUserMissing[schedule.id] = !!find(
          users,
          user => user.id === this._getScheduleJob(schedule).userId
        )
      })

      return isScheduleUserMissing
    }
  )

  render () {
    const { schedules } = this.state

    return process.env.XOA_PLAN > 3 ? (
      <Container>
        <Card>
          <CardHeader>
            <Icon icon='schedule' /> {_('backupSchedules')}
          </CardHeader>
          <CardBlock>
            <SortedTable
              actions={ACTIONS}
              collection={schedules}
              columns={COLUMNS}
              individualActions={INDIVIDUAL_ACTIONS}
              shortcutsTarget='body'
              stateUrlParam='s'
              userData={{
                isScheduleUserMissing: this._getIsScheduleUserMissing(),
                jobs: this.state.jobs || {},
              }}
            />
          </CardBlock>
        </Card>
        <LogList jobKeys={Object.keys(jobKeyToLabel)} />
      </Container>
    ) : (
      <Container>
        <Upgrade place='health' available={4} />
      </Container>
    )
  }
}
