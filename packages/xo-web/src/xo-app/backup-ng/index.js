import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { Card, CardHeader, CardBlock } from 'card'
import { confirm } from 'modal'
import { constructQueryString } from 'smart-backup'
import { Container, Row, Col } from 'grid'
import { get } from '@xen-orchestra/defined'
import { isEmpty, map, groupBy, some } from 'lodash'
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
import FileRestoreLegacy from './file-restore-legacy'
import Restore from './restore'
import RestoreLegacy from './restore-legacy'
import Health from './health'
import { destructPattern } from './utils'

const Ul = props => <ul {...props} style={{ listStyleType: 'none' }} />
const Li = props => (
  <li
    {...props}
    style={{
      whiteSpace: 'nowrap',
    }}
  />
)

const _runBackupNgJob = ({ id, name, schedule }) =>
  confirm({
    title: _('runJob'),
    body: _('runBackupNgJobConfirm', {
      id: id.slice(0, 5),
      name: <strong>{name}</strong>,
    }),
  }).then(() => runBackupNgJob({ id, schedule }))

const SchedulePreviewBody = ({ item: job, userData: { schedulesByJob } }) => (
  <div>
    {map(schedulesByJob && schedulesByJob[job.id], schedule => (
      <Ul key={schedule.id}>
        {schedule.name ? (
          <Li>{_.keyValue(_('scheduleName'), schedule.name)}</Li>
        ) : (
          <Li>{_.keyValue(_('scheduleCron'), schedule.cron)}</Li>
        )}
        <Li>
          <StateButton
            disabledLabel={_('stateDisabled')}
            disabledHandler={enableSchedule}
            disabledTooltip={_('logIndicationToEnable')}
            enabledLabel={_('stateEnabled')}
            enabledHandler={disableSchedule}
            enabledTooltip={_('logIndicationToDisable')}
            handlerParam={schedule.id}
            state={schedule.enabled}
            style={{ marginRight: '0.5em' }}
          />
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
        </Li>
      </Ul>
    ))}
  </div>
)

const MODES = [
  {
    label: 'rollingSnapshot',
    test: job =>
      some(job.settings, ({ snapshotRetention }) => snapshotRetention > 0),
  },
  {
    label: 'backup',
    test: job =>
      job.mode === 'full' && !isEmpty(get(() => destructPattern(job.remotes))),
  },
  {
    label: 'deltaBackup',
    test: job =>
      job.mode === 'delta' && !isEmpty(get(() => destructPattern(job.remotes))),
  },
  {
    label: 'continuousReplication',
    test: job =>
      job.mode === 'delta' && !isEmpty(get(() => destructPattern(job.srs))),
  },
  {
    label: 'disasterRecovery',
    test: job =>
      job.mode === 'full' && !isEmpty(get(() => destructPattern(job.srs))),
  },
]

@addSubscriptions({
  jobs: subscribeBackupNgJobs,
  schedulesByJob: cb =>
    subscribeSchedules(schedules => {
      cb(groupBy(schedules, 'jobId'))
    }),
})
class JobsTable extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
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
        valuePath: 'name',
        name: _('jobName'),
        default: true,
      },
      {
        itemRenderer: job => (
          <Ul>
            {MODES.filter(({ test }) => test(job)).map(({ label }) => (
              <Li key={label}>{_(label)}</Li>
            ))}
          </Ul>
        ),
        sortCriteria: 'mode',
        name: _('jobModes'),
      },
      {
        component: SchedulePreviewBody,
        name: _('jobSchedules'),
      },
      {
        itemRenderer: job => {
          const { concurrency, offlineSnapshot, reportWhen, timeout } =
            job.settings[''] || {}

          return (
            <Ul>
              {reportWhen && <Li>{_.keyValue(_('reportWhen'), reportWhen)}</Li>}
              {concurrency > 0 && (
                <Li>{_.keyValue(_('concurrency'), concurrency)}</Li>
              )}
              {timeout > 0 && (
                <Li>{_.keyValue(_('timeout'), timeout / 3600e3)} hours</Li>
              )}
              {offlineSnapshot && (
                <Li>
                  {_.keyValue(
                    _('offlineSnapshot'),
                    <span className='text-success'>{_('stateEnabled')}</span>
                  )}
                </Li>
              )}
            </Ul>
          )
        },
        name: _('formNotes'),
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
          <NavLink to='/backup-ng/restore-legacy'>
            <Icon icon='menu-backup-restore' /> {_('backupRestoreLegacyPage')}
          </NavLink>
          <NavLink to='/backup-ng/file-restore-legacy'>
            <Icon icon='menu-backup-file-restore' />{' '}
            {_('backupFileRestoreLegacyPage')}
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
  'restore-legacy': RestoreLegacy,
  'file-restore': FileRestore,
  'file-restore-legacy': FileRestoreLegacy,
  health: Health,
})(({ children }) => (
  <Page header={HEADER} title='backupPage' formatTitle>
    {children}
  </Page>
))
