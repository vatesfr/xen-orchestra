import _ from 'intl'
import Icon from 'icon'
import React from 'react'

import { Container, Col, Row } from 'grid'
import { getXoaPlan, routes, TryXoa } from 'utils'
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
            <Icon icon='hub-template' /> {_('templatesLabel')}
          </NavLink>
          <NavLink to='/hub/recipes'>
            <Icon icon='hub-recipe' /> {_('recipesLabel')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Hub = routes('hub', {
  templates: Templates,
  recipes: Recipes,
})(({ children }) => (
  <Page header={Header} title='hubPage' formatTitle>
    {getXoaPlan() === 'Community' ? (
      <Container>
        <h2 className='text-info'>{_('hubCommunity')}</h2>
        <p>
          <TryXoa page='hub' />
        </p>
      </Container>
    ) : (
      children
    )}
  </Page>
))

export default Hub
