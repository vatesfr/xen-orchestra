import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import ButtonLink from 'button-link'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { adminOnly, connectStore, routes } from 'utils'
import { Card, CardHeader, CardBlock } from 'card'
import { Container, Row, Col } from 'grid'
import { createCounter, getLoneSnapshots } from 'selectors'
import { NavLink, NavTabs } from 'nav'
import { subscribeBackupNgJobs, subscribeSchedules } from 'xo'

import Edit from './edit'
import FileRestore from './file-restore'
import Health from './health'
import NewVmBackup, { NewMetadataBackup, NewMirrorBackup, NewSequence } from './new'
import Overview from './overview'
import Restore, { RestoreMetadata } from './restore'
import Sequences from './sequences'

import Page from '../page'

const HealthNavTab = decorate([
  addSubscriptions({
    // used by getLoneSnapshots
    schedules: subscribeSchedules,
    jobs: subscribeBackupNgJobs,
  }),
  connectStore({
    nLoneSnapshots: createCounter(getLoneSnapshots),
  }),
  ({ nLoneSnapshots }) => (
    <NavLink to='/backup/health'>
      <Icon icon='menu-dashboard-health' /> {_('overviewHealthDashboardPage')}{' '}
      {nLoneSnapshots > 0 && (
        <Tooltip content={_('loneSnapshotsMessages', { nLoneSnapshots })}>
          <span className='tag tag-pill tag-warning'>{nLoneSnapshots}</span>
        </Tooltip>
      )}
    </NavLink>
  ),
])

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
          <NavLink to='/backup/overview'>
            <Icon icon='menu-backup-overview' /> {_('backupOverviewPage')}
          </NavLink>
          <NavLink to='/backup/sequences'>
            <Icon icon='menu-backup-sequence' /> {_('sequences')}
          </NavLink>
          <NavLink to='/backup/new'>
            <Icon icon='menu-backup-new' /> {_('backupNewPage')}
          </NavLink>
          <NavLink to='/backup/restore'>
            <Icon icon='menu-backup-restore' /> {_('backupRestorePage')}
          </NavLink>
          <NavLink to='/backup/file-restore'>
            <Icon icon='menu-backup-file-restore' /> {_('backupFileRestorePage')}
          </NavLink>
          <HealthNavTab />
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const ChooseBackupType = () => (
  <Container>
    <Row>
      <Col>
        <Card>
          <CardHeader>{_('backupType')}</CardHeader>
          <CardBlock className='text-md-center'>
            <p>
              <ButtonLink to='backup/new/vms'>
                <Icon icon='backup' /> {_('backupVms')}
              </ButtonLink>{' '}
              <ButtonLink to='backup/new/mirror'>
                <Icon icon='mirror-backup' /> {_('mirrorBackupVms')}
              </ButtonLink>
            </p>
            <p>
              <ButtonLink to='backup/new/metadata'>
                <Icon icon='database' /> {_('backupMetadata')}
              </ButtonLink>{' '}
              <ButtonLink to='backup/new/sequence'>
                <Icon icon='menu-backup-sequence' /> {_('sequence')}
              </ButtonLink>
            </p>
          </CardBlock>
        </Card>
      </Col>
    </Row>
  </Container>
)

export default routes('overview', {
  ':id/edit': Edit,
  new: ChooseBackupType,
  'new/vms': NewVmBackup,
  'new/mirror': NewMirrorBackup,
  'new/metadata': NewMetadataBackup,
  'new/sequence': NewSequence,
  overview: Overview,
  sequences: Sequences,
  restore: Restore,
  'restore/metadata': RestoreMetadata,
  'file-restore': FileRestore,
  health: Health,
})(
  adminOnly(({ children }) => (
    <Page header={HEADER} title='backupPage' formatTitle>
      {children}
    </Page>
  ))
)
