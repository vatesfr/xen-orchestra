import _ from 'messages'
import { Button } from 'react-bootstrap-4/lib'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'
import React, { Component } from 'react'

import Icon from 'icon'
import { Col } from 'grid'

export default class Menu extends Component {
  render () {
    return <Col smallSize={3} className='xo-menu'>
      <p className='xo-collapse-item'>
        <Button className='btn-collapse' onClick={() => this.setState({...this.state, collapsed: !this.state.collapsed})}>
          <Icon icon='menu-collapse' />
        </Button>
      </p>
      <ul className='nav nav-sidebar nav-pills nav-stacked'>
        <li className='nav-item xo-menu-item'>
          <IndexLink activeClassName='xo-menu-item-selected' className='nav-link' to='/'>
            <Icon icon='menu-home' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('homePage')}
          </IndexLink>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-dashboard' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('dashboardPage')}
          </Link>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-self-service' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('selfServicePage')}
          </Link>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-backup' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('backupPage')}
          </Link>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-update' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('updatePage')}
          </Link>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-settings' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('settingsPage')}
          </Link>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-about' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('aboutPage')}
          </Link>
        </li>
        <li className='nav-item xo-menu-item'>
          <Link activeClassName='xo-menu-item-selected' className='nav-link' to='/about'>
            <Icon icon='menu-create' size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
            {_('createMenu')}
          </Link>
        </li>
      </ul>
    </Col>
  }
}
