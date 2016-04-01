import _ from 'messages'
import React, { Component } from 'react'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'

import Icon from 'icon'
import { Col } from 'grid'

export default class Menu extends Component {
  render () {
    return <Col smallSize={3} className='xo-menu'>
      <ul className='nav nav-sidebar nav-pills nav-stacked'>
        <li className='nav-item xo-menu-item'>
          <IndexLink activeClassName='xo-menu-item-selected' className='nav-link' to='/'>
            <Icon icon='menu-home' size='lg' fixedWidth/>&nbsp;
            {_('homePage')}
          </IndexLink>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-about' size='lg' fixedWidth/>
            {_('aboutPage')}
          </Link>
        </li>
      </ul>
    </Col>
  }
}
