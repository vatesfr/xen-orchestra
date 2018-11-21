import _ from 'intl'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import React from 'react'
import { adminOnly, routes } from 'utils'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'

import New from './new'
import Edit from './edit'
import Overview from './overview'

const DeprecatedMsg = () => (
  <div className='alert alert-warning'>
    {_('backupDeprecatedMessage')}
    <br />
    <Link to='/backup-ng/new'>{_('backupNgNewPage')}</Link>
  </div>
)

const DEVELOPMENT = process.env.NODE_ENV === 'development'

const MovingRestoreMessage = () => (
  <div className='alert alert-warning'>
    <Link to='/backup-ng/restore'>{_('moveRestoreLegacyMessage')}</Link>
  </div>
)

const MovingFileRestoreMessage = () => (
  <div className='alert alert-warning'>
    <Link to='/backup-ng/file-restore'>{_('moveRestoreLegacyMessage')}</Link>
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
          <NavLink to='/backup/overview'>
            <Icon icon='menu-backup-overview' /> {_('backupOverviewPage')}
          </NavLink>
          <NavLink to='/backup/new'>
            <Icon icon='menu-backup-new' /> {_('backupNewPage')}
          </NavLink>
          <NavLink to='/backup/restore'>
            <Icon icon='menu-backup-restore' /> {_('backupRestorePage')}
          </NavLink>
          <NavLink to='/backup/file-restore'>
            <Icon icon='menu-backup-file-restore' />{' '}
            {_('backupFileRestorePage')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Backup = routes('overview', {
  ':id/edit': Edit,
  new: DEVELOPMENT ? New : DeprecatedMsg,
  overview: Overview,
  restore: MovingRestoreMessage,
  'file-restore': MovingFileRestoreMessage,
})(
  adminOnly(({ children }) => (
    <Page header={HEADER} title='backupPage' formatTitle>
      {children}
    </Page>
  ))
)

export default Backup
