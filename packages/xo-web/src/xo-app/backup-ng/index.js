import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import { Card, CardHeader, CardBlock } from 'card'
import { constructQueryString } from 'smart-backup-pattern'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'
import { routes } from 'utils'
import { deleteBackupNgJobs, subscribeBackupNgJobs } from 'xo'

import LogsTable from '../logs'
import Page from '../page'

import Edit from './edit'
import New from './new'

@addSubscriptions({
  jobs: subscribeBackupNgJobs,
})
class JobsTable extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object,
  }

  static tableProps = {
    actions: [
      // {
      //   handler: job => {
      //     throw new Error('not implemented')
      //   },
      //   label: _('runJob'),
      //   icon: 'run-schedule',
      //   level: 'warning',
      // },
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
        itemRenderer: _ =>
          _.settings[Object.keys(_.settings)[0]].snapshotRetention,
        sortCriteria: _ =>
          _.settings[Object.keys(_.settings)[0]].snapshotRetention,
        name: 'snapshotRetention',
      },
      {
        itemRenderer: _ =>
          _.settings[Object.keys(_.settings)[0]].exportRetention,
        sortCriteria: _ =>
          _.settings[Object.keys(_.settings)[0]].exportRetention,
        name: 'exportRetention',
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
  // restore: Restore,
  // 'file-restore': FileRestore,
})(({ children }) => (
  <Page header={HEADER} title={_('backupPage')}>
    {children}
  </Page>
))
