import _ from 'intl'
import Icon from 'icon'
import Link from 'link'
import LogList from '../../logs'
import PropTypes from 'prop-types'
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

const SCHEDULES_COLUMNS = [
  {
    itemRenderer: schedule => <span>{`${schedule.name} (${schedule.id.slice(4, 8)})`}</span>,
    name: _('schedule'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: (schedule, { jobs, isScheduleUserMissing }) => {
      const jobId = schedule.jobId
      const job = jobs[jobId]

      return (
        job !== undefined && (
          <div>
            <span>{`${job.name} - ${job.method} (${jobId.slice(4, 8)})`}</span>{' '}
            {isScheduleUserMissing[schedule.id] && (
              <Tooltip content={_('jobUserNotFound')}>
                <Icon className='mr-1' icon='error' />
              </Tooltip>
            )}
            <Link className='btn btn-sm btn-primary ml-1' to={`/jobs/${job.id}/edit`}>
              <Tooltip content={_('jobEdit')}>
                <Icon icon='edit' />
              </Tooltip>
            </Link>
          </div>
        )
      )
    },
    name: _('job'),
    sortCriteria: (schedule, { jobs }) => {
      const job = jobs[schedule.jobId]
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
        disabledLabel={_('stateDisabled')}
        disabledHandler={enableSchedule}
        disabledTooltip={_('logIndicationToEnable')}
        enabledLabel={_('stateEnabled')}
        enabledHandler={disableSchedule}
        enabledTooltip={_('logIndicationToDisable')}
        handlerParam={schedule.id}
        state={schedule.enabled}
      />
    ),
    name: _('state'),
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
  static contextTypes = {
    router: PropTypes.object,
  }

  constructor(props) {
    super(props)
    this.state = {
      schedules: [],
    }
  }

  componentWillMount() {
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
        schedules: orderBy(schedules, schedule => +schedule.id.split(':')[1], ['desc']),
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeJobs()
      unsubscribeSchedules()
    }
  }

  _getScheduleJob(schedule) {
    const { jobs } = this.state || {}
    return jobs[schedule.jobId]
  }

  _getIsScheduleUserMissing = createSelector(
    () => this.state.schedules,
    () => this.props.users,
    (schedules, users) => {
      const isScheduleUserMissing = {}

      forEach(schedules, schedule => {
        isScheduleUserMissing[schedule.id] = !find(users, user => user.id === this._getScheduleJob(schedule).userId)
      })

      return isScheduleUserMissing
    }
  )

  _individualActions = [
    {
      disabled: (schedule, { isScheduleUserMissing }) => isScheduleUserMissing[schedule.id],
      handler: schedule => runJob(schedule.jobId),
      icon: 'run-schedule',
      label: _('scheduleRun'),
      level: 'warning',
    },
    {
      handler: schedule =>
        this.context.router.push({
          pathname: `/jobs/schedules/${schedule.id}/edit`,
        }),
      icon: 'edit',
      label: _('scheduleEdit'),
      level: 'primary',
    },
  ]

  render() {
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
              columns={SCHEDULES_COLUMNS}
              data-isScheduleUserMissing={this._getIsScheduleUserMissing()}
              data-jobs={this.state.jobs || {}}
              individualActions={this._individualActions}
              shortcutsTarget='body'
              stateUrlParam='s'
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
