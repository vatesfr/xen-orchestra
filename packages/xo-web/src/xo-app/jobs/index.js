import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'
import { adminOnly, routes } from 'utils'

import Edit from './edit'
import New from './new'
import Overview from './overview'
import Schedules from './schedules'
import EditSchedule from './schedules/edit'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='jobs' /> {_('jobsPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink to='/jobs/overview'>
            <Icon icon='menu-jobs-overview' /> {_('jobsOverviewPage')}
          </NavLink>
          <NavLink to='/jobs/new'>
            <Icon icon='menu-jobs-new' /> {_('jobsNewPage')}
          </NavLink>
          <NavLink to='/jobs/schedules'>
            <Icon icon='menu-jobs-schedule' /> {_('jobsSchedulingPage')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Jobs = routes('overview', {
  ':id/edit': Edit,
  new: New,
  overview: Overview,
  schedules: Schedules,
  'schedules/:id/edit': EditSchedule,
})(
  adminOnly(({ children }) => (
    <Page header={HEADER} title='jobsPage' formatTitle>
      {children}
    </Page>
  ))
)

export default Jobs
