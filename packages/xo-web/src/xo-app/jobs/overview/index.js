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
import { filter, forEach, keyBy } from 'lodash'
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
  jobs: [cb => subscribeJobs(jobs => cb(keyBy(jobs, 'id'))), {}],
  schedules: [subscribeSchedules, []],
  userIds: [cb => subscribeUsers(users => cb(new Set(users.map(_ => _.id)))), new Set()],
})
export default class Overview extends Component {
  static contextTypes = {
    router: PropTypes.object,
  }

  _getGenericSchedules = createSelector(
    () => this.props.schedules,
    () => this.props.jobs,

    // Get only generic jobs
    (schedules, jobs) =>
      filter(schedules, schedule => {
        const job = jobs[schedule.jobId]
        return job !== undefined && job.key in jobKeyToLabel
      })
  )

  _getIsScheduleUserMissing = createSelector(
    this._getGenericSchedules,
    () => this.props.userIds,
    () => this.props.jobs,
    (schedules, userIds, jobs) => {
      const isScheduleUserMissing = {}

      forEach(schedules, schedule => {
        isScheduleUserMissing[schedule.id] = !userIds.has(jobs[schedule.jobId].userId)
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
    return process.env.XOA_PLAN > 3 ? (
      <Container>
        <Card>
          <CardHeader>
            <Icon icon='schedule' /> {_('backupSchedules')}
          </CardHeader>
          <CardBlock>
            <SortedTable
              actions={ACTIONS}
              collection={this._getGenericSchedules()}
              columns={SCHEDULES_COLUMNS}
              data-isScheduleUserMissing={this._getIsScheduleUserMissing()}
              data-jobs={this.props.jobs}
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
