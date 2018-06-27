import _ from 'intl'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import LogList from '../../logs'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { confirm } from 'modal'
import { addSubscriptions } from 'utils'
import { constructQueryString } from 'smart-backup'
import { createSelector } from 'selectors'
import { Card, CardHeader, CardBlock } from 'card'
import { filter, find, forEach, get, keyBy, map, orderBy } from 'lodash'
import {
  deleteBackupSchedule,
  disableSchedule,
  enableSchedule,
  migrateBackupSchedule,
  runJob,
  subscribeJobs,
  subscribeSchedules,
  subscribeUsers,
} from 'xo'

// ===================================================================

const jobKeyToLabel = {
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot'),
}

const _runJob = ({ jobLabel, jobId, scheduleTag }) =>
  confirm({
    title: _('runJob'),
    body: _('runJobConfirm', {
      backupType: <strong>{jobLabel}</strong>,
      id: <strong>{jobId.slice(4, 8)}</strong>,
      tag: scheduleTag,
    }),
  }).then(() => runJob(jobId))

const JOB_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: ({ jobId }) => jobId.slice(4, 8),
    sortCriteria: 'jobId',
  },
  {
    name: _('jobType'),
    itemRenderer: ({ jobLabel }) => jobLabel,
    sortCriteria: 'jobLabel',
  },
  {
    name: _('jobTag'),
    itemRenderer: ({ scheduleTag }) => scheduleTag,
    default: true,
    sortCriteria: ({ scheduleTag }) => scheduleTag,
  },
  {
    name: _('jobScheduling'),
    itemRenderer: ({ schedule }) => schedule.cron,
    sortCriteria: ({ schedule }) => schedule.cron,
  },
  {
    name: _('jobTimezone'),
    itemRenderer: ({ schedule }) => schedule.timezone || _('jobServerTimezone'),
    sortCriteria: ({ schedule }) => schedule.timezone,
  },
  {
    name: _('state'),
    itemRenderer: ({ schedule }) => (
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
    sortCriteria: 'schedule.enabled',
  },
  {
    name: _('jobAction'),
    itemRenderer: (item, isScheduleUserMissing) => {
      const { redirect, schedule } = item
      const { id } = schedule

      return (
        <fieldset>
          {isScheduleUserMissing[id] && (
            <Tooltip content={_('backupUserNotFound')}>
              <Icon className='mr-1' icon='error' />
            </Tooltip>
          )}
          <Link
            className='btn btn-sm btn-primary mr-1'
            to={`/backup/${id}/edit`}
          >
            <Icon icon='edit' />
          </Link>
          <ButtonGroup>
            {redirect && (
              <ActionRowButton
                btnStyle='primary'
                handler={redirect}
                icon='preview'
                tooltip={_('redirectToMatchingVms')}
              />
            )}
            <ActionRowButton
              btnStyle='warning'
              disabled={isScheduleUserMissing[id]}
              handler={_runJob}
              handlerParam={item}
              icon='run-schedule'
            />
            <ActionRowButton
              btnStyle='danger'
              handler={migrateBackupSchedule}
              handlerParam={schedule.jobId}
              icon='migrate-job'
              tooltip={_('migrateToBackupNg')}
            />
            <ActionRowButton
              btnStyle='danger'
              handler={deleteBackupSchedule}
              handlerParam={schedule}
              icon='delete'
            />
          </ButtonGroup>
        </fieldset>
      )
    },
    textAlign: 'right',
  },
]

// ===================================================================

@addSubscriptions({
  jobs: cb => subscribeJobs(jobs => cb(keyBy(jobs, 'id'))),
  schedules: cb => subscribeSchedules(schedules => cb(keyBy(schedules, 'id'))),
  users: subscribeUsers,
})
export default class Overview extends Component {
  static contextTypes = {
    router: React.PropTypes.object,
  }

  _getSchedules = createSelector(
    () => this.props.jobs,
    () => this.props.schedules,
    (jobs, schedules) =>
      jobs === undefined || schedules === undefined
        ? []
        : orderBy(
            filter(schedules, schedule => {
              const job = jobs[schedule.jobId]
              return job && jobKeyToLabel[job.key]
            }),
            'id'
          )
  )

  _redirectToMatchingVms = pattern => {
    this.context.router.push({
      pathname: '/home',
      query: { t: 'VM', s: constructQueryString(pattern) },
    })
  }

  _getScheduleCollection = createSelector(
    this._getSchedules,
    () => this.props.jobs,
    (schedules, jobs) => {
      if (!schedules || !jobs) {
        return []
      }

      return map(schedules, schedule => {
        const job = jobs[schedule.jobId]
        const { items } = job.paramsVector
        const pattern = get(items, '[1].collection.pattern')

        return {
          jobId: job.id,
          jobLabel: jobKeyToLabel[job.key] || _('unknownSchedule'),
          redirect:
            pattern !== undefined &&
            (() => this._redirectToMatchingVms(pattern)),
          // Old versions of XenOrchestra use items[0]
          scheduleTag:
            get(items, '[0].values[0].tag') ||
            get(items, '[1].values[0].tag') ||
            schedule.id,
          schedule,
        }
      })
    }
  )

  _getIsScheduleUserMissing = createSelector(
    this._getSchedules,
    () => this.props.jobs,
    () => this.props.users,
    (schedules, jobs, users) => {
      const isScheduleUserMissing = {}
      forEach(schedules, schedule => {
        isScheduleUserMissing[schedule.id] = !(
          jobs && find(users, user => user.id === jobs[schedule.jobId].userId)
        )
      })

      return isScheduleUserMissing
    }
  )

  render () {
    const schedules = this._getSchedules()
    const isScheduleUserMissing = this._getIsScheduleUserMissing()

    return (
      <div>
        <Card>
          <CardHeader>
            <Icon icon='schedule' /> {_('backupSchedules')}
          </CardHeader>
          <CardBlock>
            <NoObjects
              collection={schedules}
              emptyMessage={
                <span>
                  {_('noScheduledJobs')}{' '}
                  <Link to='/backup-ng/health'>{_('legacySnapshotsLink')}</Link>
                </span>
              }
            >
              {() => (
                <div>
                  <div className='alert alert-warning'>
                    {_('backupDeprecatedMessage')}
                    <br />
                    <a href='https://xen-orchestra.com/blog/migrate-backup-to-backup-ng/'>
                      {_('backupMigrationLink')}
                    </a>
                  </div>
                  <SortedTable
                    columns={JOB_COLUMNS}
                    collection={this._getScheduleCollection()}
                    userData={isScheduleUserMissing}
                  />
                </div>
              )}
            </NoObjects>
          </CardBlock>
        </Card>
        <LogList jobKeys={Object.keys(jobKeyToLabel)} />
      </div>
    )
  }
}
