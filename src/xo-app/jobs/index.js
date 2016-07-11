import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'
import { routes } from 'utils'

import Edit from './edit'
import New from './new'
import Overview from './overview'
import Scheduling from './scheduling'
import SchedulingEdit from './scheduling/edit'

const HEADER = <Container>
  <Row>
    <Col mediumSize={3}>
      <h2><Icon icon='jobs' /> {_('jobsPage')}</h2>
    </Col>
    <Col mediumSize={9}>
      <NavTabs className='pull-xs-right'>
        <NavLink to={'/jobs/overview'}><Icon icon='menu-jobs-overview' /> {_('jobsOverviewPage')}</NavLink>
        <NavLink to={'/jobs/new'}><Icon icon='menu-jobs-new' /> {_('jobsNewPage')}</NavLink>
        <NavLink to={'/jobs/scheduling'}><Icon icon='menu-jobs-schedule' /> {_('jobsSchedulingPage')}</NavLink>
      </NavTabs>
    </Col>
  </Row>
</Container>

const Jobs = routes('overview', {
  ':id/edit': Edit,
  new: New,
  overview: Overview,
  scheduling: Scheduling,
  'scheduling/:id/edit': SchedulingEdit
})(
  ({ children }) => <Page header={HEADER} title='jobsPage' formatTitle>{children}</Page>
)

export default Jobs
