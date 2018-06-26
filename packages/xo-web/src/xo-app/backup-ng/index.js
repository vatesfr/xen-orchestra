import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { confirm } from 'modal'
import { map, groupBy } from 'lodash'
import { Card, CardHeader, CardBlock } from 'card'
import { constructQueryString } from 'smart-backup'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'
import { routes } from 'utils'
import {
  cancelJob,
  deleteBackupNgJobs,
  disableSchedule,
  enableSchedule,
  runBackupNgJob,
  subscribeBackupNgJobs,
  subscribeSchedules,
} from 'xo'

import LogsTable from '../logs/backup-ng-logs'
import Page from '../page'

import Edit from './edit'
import New from './new'
import FileRestore from './file-restore'
import Restore from './restore'
import Health from './health'

const _runBackupNgJob = ({ id, name, schedule }) =>
  confirm({
    title: _('runJob'),
    body: _('runBackupNgJobConfirm', {
      id: id.slice(0, 5),
      name: <strong>{name}</strong>,
    }),
  }).then(() => runBackupNgJob({ id, schedule }))

const SchedulePreviewBody = ({ item: job, userData: { schedulesByJob } }) => (
  <table>
    <tr className='text-muted'>
      <th>{_('scheduleCron')}</th>
      <th>{_('scheduleTimezone')}</th>
      <th>{_('scheduleExportRetention')}</th>
      <th>{_('scheduleCopyRetention')}</th>
      <th>{_('scheduleSnapshotRetention')}</th>
      <th>{_('scheduleRun')}</th>
    </tr>
    {map(schedulesByJob && schedulesByJob[job.id], schedule => (
      <tr key={schedule.id}>
        <td>{schedule.cron}</td>
        <td>{schedule.timezone}</td>
        <td>{job.settings[schedule.id].exportRetention}</td>
        <td>{job.settings[schedule.id].copyRetention}</td>
        <td>{job.settings[schedule.id].snapshotRetention}</td>
        <td>
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
        </td>
        <td>
          {job.runId !== undefined ? (
            <ActionButton
              btnStyle='danger'
              handler={cancelJob}
              handlerParam={job}
              icon='cancel'
              key='cancel'
              size='small'
              tooltip={_('formCancel')}
            />
          ) : (
            <ActionButton
              btnStyle='primary'
              data-id={job.id}
              data-name={job.name}
              data-schedule={schedule.id}
              handler={_runBackupNgJob}
              icon='run-schedule'
              key='run'
              size='small'
            />
          )}
        </td>
      </tr>
    ))}
  </table>
)

@addSubscriptions({
  jobs: subscribeBackupNgJobs,
  schedulesByJob: cb =>
    subscribeSchedules(schedules => {
      cb(groupBy(schedules, 'jobId'))
    }),
})
class JobsTable extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object,
  }

  static tableProps = {
    actions: [
      {
        handler: deleteBackupNgJobs,
        label: _('deleteBackupSchedule'),
        icon: 'delete',
        level: 'danger',
      },
    ],
    columns: [
      {
        itemRenderer: _ => _.id.slice(4, 8),
        name: _('jobId'),
      },
      {
        itemRenderer: _ => _.name,
        sortCriteria: 'name',
        name: _('jobName'),
        default: true,
      },
      {
        itemRenderer: _ => (
          <span style={{ textTransform: 'capitalize' }}>{_.mode}</span>
        ),
        sortCriteria: 'mode',
        name: _('jobMode'),
      },
      {
        component: SchedulePreviewBody,
        name: _('jobSchedules'),
      },
    ],
    individualActions: [
      {
        handler: (job, { goTo }) =>
          goTo({
            pathname: '/home',
            query: { t: 'VM', s: constructQueryString(job.vms) },
          }),
        label: _('redirectToMatchingVms'),
        icon: 'preview',
      },
      {
        handler: (job, { goTo }) => goTo(`/backup-ng/${job.id}/edit`),
        label: _('formEdit'),
        icon: 'edit',
        level: 'primary',
      },
    ],
  }

  _goTo = path => {
    this.context.router.push(path)
  }

  render () {
    return (
      <SortedTable
        {...JobsTable.tableProps}
        collection={this.props.jobs}
        data-goTo={this._goTo}
        data-schedulesByJob={this.props.schedulesByJob}
      />
    )
  }
}

const Overview = () => (
  <div>
    <Card>
      <CardHeader>
        <Icon icon='schedule' /> {_('backupSchedules')}
      </CardHeader>
      <CardBlock>
        <JobsTable />
      </CardBlock>
    </Card>
    <LogsTable />
  </div>
)

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='backup' /> {_('backupPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink exact to='/backup-ng/overview'>
            <Icon icon='menu-backup-overview' /> {_('backupOverviewPage')}
          </NavLink>
          <NavLink to='/backup-ng/new'>
            <Icon icon='menu-backup-new' /> {_('backupNewPage')}
          </NavLink>
          <NavLink to='/backup-ng/restore'>
            <Icon icon='menu-backup-restore' /> {_('backupRestorePage')}
          </NavLink>
          <NavLink to='/backup-ng/file-restore'>
            <Icon icon='menu-backup-file-restore' />{' '}
            {_('backupFileRestorePage')}
          </NavLink>
          <NavLink to='/backup-ng/health'>
            <Icon icon='menu-dashboard-health' />{' '}
            {_('overviewHealthDashboardPage')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

export default routes('overview', {
  ':id/edit': Edit,
  new: New,
  overview: Overview,
  restore: Restore,
  'file-restore': FileRestore,
  health: Health,
})(({ children }) => (
  <Page header={HEADER} title='backupPage' formatTitle>
    {children}
  </Page>
))
