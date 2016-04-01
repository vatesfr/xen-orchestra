import _ from 'messages'
import React, { Component } from 'react'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'

import Icon from 'icon'
import { Row, Col } from 'grid'

export default class Menu extends Component {
  render () {
    return <div className='xo-menu'>
      <ul className='nav nav-pills nav-stacked'>
        <li className='nav-item xo-menu-item'>
          <IndexLink activeClassName='xo-menu-item-selected' className='nav-link' to='/'>
            <Row>
              <Col smallSize={3}>
                <Icon icon='menu-home' size='lg' fixedWidth/>
              </ Col>
              <Col smallSize={9}>
                {_('homePage')}
              </ Col>
            </ Row>
          </IndexLink>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Row>
              <Col smallSize={3}>
                <Icon icon='menu-about' size='lg' fixedWidth/>
              </ Col>
              <Col smallSize={9}>
                {_('aboutPage')}
              </ Col>
            </ Row>
          </Link>
        </li>
      </ul>
    </div>
  }
}
