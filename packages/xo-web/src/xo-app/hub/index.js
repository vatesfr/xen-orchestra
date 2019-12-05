import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { alert } from 'modal'

import { Container, Col, Row } from 'grid'
import { getXoaPlan, routes } from 'utils'
import { NavLink, NavTabs } from 'nav'

import Page from '../page'
import Recipes from './recipes'
import Templates from './templates'

// ==================================================================

const subscribeAlert = () =>
  alert(
    _('hubResourceAlert'),
    <div>
      <p>
        {_('considerSubscribe', {
          link: 'https://xen-orchestra.com',
        })}
      </p>
    </div>
  )

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
            <Icon icon='hub-template' /> Templates
          </NavLink>
          <NavLink to='/hub/recipes'>
            <Icon icon='hub-recipe' /> Recipes
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Hub = routes('hub', {
  templates: Templates,
  recipes: Recipes,
})(({ children }) =>
  getXoaPlan() === 'Community' ? (
    subscribeAlert()
  ) : (
    <Page header={Header} title='hubPage' formatTitle>
      {children}
    </Page>
  )
)

export default Hub
