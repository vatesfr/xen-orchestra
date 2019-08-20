import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { routes } from 'utils'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'

import Update from './update'
import Licenses from './licenses'
import Notifications, { NotificationTag } from './notifications'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='menu-xoa' /> {_('xoaPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink to='/xoa/update'>
            <Icon icon='menu-update' /> {_('updatePage')}
          </NavLink>
          <NavLink to='/xoa/licenses'>
            <Icon icon='menu-license' /> {_('licensesPage')}
          </NavLink>
          <NavLink to='/xoa/notifications'>
            <Icon icon='menu-notification' /> {_('notificationsPage')}{' '}
            <NotificationTag />
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Xoa = routes('xoa', {
  update: Update,
  licenses: Licenses,
  notifications: Notifications,
})(({ children }) => (
  <Page header={HEADER} title='xoaPage' formatTitle>
    {children}
  </Page>
))

export default Xoa
