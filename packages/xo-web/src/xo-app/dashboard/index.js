import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { routes } from 'utils'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'

import Health from './health'
import Overview from './overview'
import Stats from './stats'
import Visualizations from './visualizations'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='menu-dashboard' /> {_('dashboardPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink to='/dashboard/overview'>
            <Icon icon='menu-dashboard-overview' /> {_('overviewDashboardPage')}
          </NavLink>
          <NavLink to='/dashboard/visualizations'>
            <Icon icon='menu-dashboard-visualization' /> {_('overviewVisualizationDashboardPage')}
          </NavLink>
          <NavLink to='/dashboard/stats'>
            <Icon icon='menu-dashboard-stats' /> {_('overviewStatsDashboardPage')}
          </NavLink>
          <NavLink to='/dashboard/health'>
            <Icon icon='menu-dashboard-health' /> {_('overviewHealthDashboardPage')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Dashboard = routes('overview', {
  health: Health,
  overview: Overview,
  stats: Stats,
  visualizations: Visualizations,
})(({ children }) => (
  <Page header={HEADER} title='dashboardPage' formatTitle>
    {children}
  </Page>
))

export default Dashboard
