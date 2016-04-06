import _ from 'messages'
import classNames from 'classnames'
import { propTypes } from 'utils'
import { Button } from 'react-bootstrap-4/lib'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'
import React, { Component } from 'react'

import Icon from 'icon'

@propTypes({
  collapsed: propTypes.bool.isRequired,
  setCollapse: propTypes.func.isRequired
})
export default class Menu extends Component {
  render () {
    const {
      collapsed,
      setCollapse
    } = this.props
    return <div className={classNames(
      `xo-menu${collapsed ? '-collapsed' : ''}`
    )}>
      <div className='xo-collapse-item'>
        <Button className='btn-collapse' onClick={() => setCollapse(!collapsed)}>
          <Icon icon='menu-collapse' />
        </Button>
      </div>
      <ul className='nav nav-sidebar nav-pills nav-stacked'>
        <MenuLinkItem to='home' label='homePage' collapsed={collapsed}/>
        <MenuLinkItem to='dashboard' label='dashboardPage' collapsed={collapsed}/>
        <MenuLinkItem to='self-service' label='selfServicePage' collapsed={collapsed}/>
        <MenuLinkItem to='backup' label='backupPage' collapsed={collapsed}/>
        <MenuLinkItem to='update' label='updatePage' collapsed={collapsed}/>
        <MenuLinkItem to='settings' label='settingsPage' collapsed={collapsed}/>
        <MenuLinkItem to='about' label='aboutPage' collapsed={collapsed}/>
        <MenuLinkItem to='create' label='createMenu' collapsed={collapsed}/>
      </ul>
    </div>
  }
}

const MenuLinkItem = (props) => {
  const { to, label, collapsed } = props
  const [ LinkComponent, path ] = to === 'home'
    ? [ IndexLink, '/' ] : [ Link, `/${to}` ]
  return <li className='nav-item xo-menu-item'>
    <LinkComponent activeClassName='xo-menu-item-selected' className='nav-link' to={path}>
      <Icon icon={`menu-${to}`} size='lg' fixedWidth/>
      {!collapsed && <span>&nbsp;&nbsp;&nbsp;</span>}
      {!collapsed && _(label)}
    </LinkComponent>
  </li>
}
