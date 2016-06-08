import _ from 'messages'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { routes } from 'utils'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'

import Admin from './admin'
import Dashboard from './dashboard'

const HEADER = <Container>
  <Row>
    <Col mediumSize={3}>
      <h2><Icon icon='menu-self-service' /> {_('selfServicePage')}</h2>
    </Col>
    <Col mediumSize={9}>
      <NavTabs className='pull-xs-right'>
        <NavLink to={'/self/dashboard'}><Icon icon='menu-self-service-dashboard' /> {_('selfServiceDashboardPage')}</NavLink>
        <NavLink to={'/self/admin'}><Icon icon='menu-self-service-admin' /> {_('selfServiceAdminPage')}</NavLink>
      </NavTabs>
    </Col>
  </Row>
</Container>

const Settings = routes('dashboard', {
  admin: Admin,
  dashboard: Dashboard
})(
  ({ children }) => <Page header={HEADER}>{children}</Page>
)

export default Settings
