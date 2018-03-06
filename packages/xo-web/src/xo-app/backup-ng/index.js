import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { map, groupBy } from 'lodash'
import { Card, CardHeader, CardBlock } from 'card'
import { constructQueryString } from 'smart-backup-pattern'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'
import { routes } from 'utils'
import {
  deleteBackupNgJobs,
  disableSchedule,
  enableSchedule,
  runBackupNgJob,
  subscribeBackupNgJobs,
  subscribeSchedules,
} from 'xo'

import LogsTable from '../logs'
import Page from '../page'

import Edit from './edit'
import New from './new'
import FileRestore from './file-restore'
import Restore from './restore'

const Ul = ({ children, ...props }) => (
  <ul {...props} style={{ display: 'inline', padding: '0 0.5em' }}>
    {children}
  </ul>
)

const Li = ({ children, ...props }) => (
  <li {...props} style={{ listStyleType: 'none', display: 'inline-block' }}>
    {children}
  </li>
)

const Td = ({ children, ...props }) => (
  <td {...props} style={{ borderRight: '1px solid black' }}>
    {children}
  </td>
)

const SchedulePreviewBody = ({ job, schedules }) => (
  <table>
    {map(schedules, schedule => (
      <tr key={schedule.id}>
        <Td>{schedule.cron}</Td>
        <Td>{schedule.timezone}</Td>
        <Td>{job.settings[schedule.id].exportRetention}</Td>
        <Td>{job.settings[schedule.id].snapshotRetention}</Td>
        <Td>
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
        </Td>
        <td>
          <ActionButton
            handler={runBackupNgJob}
            icon='run-schedule'
            size='small'
            data-id={job.id}
            data-schedule={schedule.id}
            btnStyle='warning'
          />
        </td>
      </tr>
    ))}
  </table>
)

const SchedulePreviewHeader = ({ _ }) => (
  <Ul>
    <Li>Cron</Li> | <Li>Timezone</Li> | <Li>Export retention</Li> |{' '}
    <Li>Snapshot retention</Li> | <Li>State</Li>
  </Ul>
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
        itemRenderer: _ => _.id.slice(0, 5),
        sortCriteria: _ => _.id,
        name: _('jobId'),
      },
      {
        itemRenderer: _ => _.name,
        sortCriteria: _ => _.name,
        name: _('jobName'),
      },
      {
        itemRenderer: _ => _.mode,
        sortCriteria: _ => _.mode,
        name: 'mode',
      },
      {
        component: _ => (
          <SchedulePreviewBody
            job={_.item}
            schedules={
              _.userData.schedulesByJob && _.userData.schedulesByJob[_.item.id]
            }
          />
        ),
        name: <SchedulePreviewHeader />,
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
        label: '',
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
          <NavLink exact to='/backup-ng'>
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
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

export default routes(Overview, {
  ':id/edit': Edit,
  new: New,
  restore: Restore,
  'file-restore': FileRestore,
})(({ children }) => (
  <Page header={HEADER} title='backupPage' formatTitle>
    {children}
  </Page>
))
