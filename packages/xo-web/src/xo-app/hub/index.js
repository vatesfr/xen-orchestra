import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { connectStore, routes } from 'utils'
import { Container, Col, Row } from 'grid'
import { isAdmin } from 'selectors'
import { NavLink, NavTabs } from 'nav'

import Page from '../page'
import Recipes from './recipes'
import Templates from './templates'

// ==================================================================

const Header = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='menu-hub' /> {_('hubPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink to='/hub/templates'>
            <Icon icon='menu-update' /> Templates
          </NavLink>
          <NavLink to='/hub/recipes'>
            <Icon icon='menu-license' /> Recipes
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Hub = routes('hub', {
  templates: Templates,
  recipes: Recipes,
})(
  connectStore({
    isAdmin,
  })(({ children, isAdmin }) => (
    <Page header={Header} title='hubPage' formatTitle>
      {children}
    </Page>
  ))
)

export default Hub
