import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { connectStore, routes } from 'utils'
import { Container, Row, Col } from 'grid'
import { isAdmin } from 'selectors'
import { NavLink, NavTabs } from 'nav'

import Licenses from './licenses'
import Notifications, { NotificationTag } from './notifications'
import Support from './support'
import Update from './update'

const Header = ({ isAdmin }) => (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='menu-xoa' /> {_('xoaPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          {isAdmin && (
            <NavLink to='/xoa/update'>
              <Icon icon='menu-update' /> {_('updatePage')}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to='/xoa/licenses'>
              <Icon icon='menu-license' /> {_('licensesPage')}
            </NavLink>
          )}
          <NavLink to='/xoa/notifications'>
            <Icon icon='menu-notification' /> {_('notificationsPage')} <NotificationTag />
          </NavLink>
          {isAdmin && (
            <NavLink to='/xoa/support'>
              <Icon icon='menu-support' /> {_('supportPage')}
            </NavLink>
          )}
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Xoa = routes('xoa', {
  licenses: Licenses,
  notifications: Notifications,
  support: Support,
  update: Update,
})(
  connectStore({
    isAdmin,
  })(({ children, isAdmin }) => (
    <Page header={<Header isAdmin={isAdmin} />} title='xoaPage' formatTitle>
      {children}
    </Page>
  ))
)

export default Xoa
