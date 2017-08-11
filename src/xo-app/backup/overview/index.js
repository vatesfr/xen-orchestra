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
import { addSubscriptions } from 'utils'
import { createSelector } from 'selectors'
import {
  Card,
  CardHeader,
  CardBlock
} from 'card'
import {
  filter,
  find,
  forEach,
  get,
  map,
  orderBy
} from 'lodash'
import {
  deleteBackupSchedule,
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
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot')
}

const JOB_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: ({ jobId }) => jobId.slice(4, 8),
    sortCriteria: 'jobId'
  },
  {
    name: _('jobType'),
    itemRenderer: ({ jobLabel }) => jobLabel,
    sortCriteria: 'jobLabel'
  },
  {
    name: _('jobTag'),
    itemRenderer: ({ scheduleTag }) => scheduleTag,
    default: true,
    sortCriteria: ({ scheduleTag }) => scheduleTag
  },
  {
    name: _('jobScheduling'),
    itemRenderer: ({ schedule }) => schedule.cron,
    sortCriteria: ({ schedule }) => schedule.cron
  },
  {
    name: _('jobTimezone'),
    itemRenderer: ({ schedule }) => schedule.timezone || _('jobServerTimezone'),
    sortCriteria: ({ schedule }) => schedule.timezone
  },
  {
    name: _('jobState'),
    itemRenderer: ({ schedule, scheduleToggleValue }) => <StateButton
      disabledLabel={_('jobStateDisabled')}
      disabledHandler={enableSchedule}
      disabledTooltip={_('logIndicationToEnable')}

      enabledLabel={_('jobStateEnabled')}
      enabledHandler={disableSchedule}
      enabledTooltip={_('logIndicationToDisable')}

      handlerParam={schedule.id}
      state={scheduleToggleValue}
    />,
    sortCriteria: 'scheduleToggleValue'
  },
  {
    name: _('jobAction'),
    itemRenderer: ({ schedule }, isScheduleUserMissing) => <fieldset>
      {!isScheduleUserMissing[schedule.id] && <Tooltip content={_('backupUserNotFound')}><Icon className='mr-1' icon='error' /></Tooltip>}
      <Link className='btn btn-sm btn-primary mr-1' to={`/backup/${schedule.id}/edit`}>
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
          disabled={!isScheduleUserMissing[schedule.id]}
          icon='run-schedule'
          btnStyle='warning'
          handler={runJob}
          handlerParam={schedule.job}
        />
      </ButtonGroup>
    </fieldset>,
    textAlign: 'right'
  }
]

// ===================================================================

@addSubscriptions({
  users: subscribeUsers
})
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
      // Get only backup jobs.
      schedules = filter(schedules, schedule => {
        const job = this.state.jobs && this.state.jobs[schedule.job]
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

  _getScheduleCollection = createSelector(
    () => this.state.schedules,
    () => this.state.scheduleTable,
    () => this.state.jobs,
    (schedules, scheduleTable, jobs) => {
      if (!schedules || !jobs) {
        return []
      }

      return map(schedules, schedule => {
        const job = jobs[schedule.job]
        const { items } = job.paramsVector

        return {
          jobId: job.id,
          jobLabel: jobKeyToLabel[job.key] || _('unknownSchedule'),
          // Old versions of XenOrchestra use items[0]
          scheduleTag: get(items, '[0].values[0].tag') || get(items, '[1].values[0].tag') || schedule.id,
          schedule,
          scheduleToggleValue: scheduleTable && scheduleTable[schedule.id]
        }
      })
    }
  )

  _getIsScheduleUserMissing = createSelector(
    () => this.state.schedules,
    () => this.state.jobs,
    () => this.props.users,
    (schedules, jobs, users) => {
      const isScheduleUserMissing = {}
      forEach(schedules, schedule => {
        isScheduleUserMissing[schedule.id] = !!(jobs && find(users, user => user.id === jobs[schedule.job].userId))
      })

      return isScheduleUserMissing
    }
  )

  render () {
    const {
      schedules
    } = this.state

    const isScheduleUserMissing = this._getIsScheduleUserMissing()

    return (
      <div>
        <Card>
          <CardHeader>
            <Icon icon='schedule' /> {_('backupSchedules')}
          </CardHeader>
          <CardBlock>
            <NoObjects collection={schedules} emptyMessage={_('noScheduledJobs')}>
              <SortedTable columns={JOB_COLUMNS} collection={this._getScheduleCollection()} userData={isScheduleUserMissing} />
            </NoObjects>
          </CardBlock>
        </Card>
        <LogList jobKeys={Object.keys(jobKeyToLabel)} />
      </div>
    )
  }
}
