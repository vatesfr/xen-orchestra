import _ from 'messages'
import classNames from 'classnames'
import { propTypes } from 'utils'
import { Button } from 'react-bootstrap-4/lib'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
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
    const items = [
      { to: '/home', icon: 'home', label: 'homePage' },
      { to: '/dashboard', icon: 'dashboard', label: 'dashboardPage' },
      { to: '/self', icon: 'self-service', label: 'selfServicePage', subMenu: [
        { to: '/self/dashboard', icon: 'self-service-dashboard', label: 'selfServiceDashboardPage' },
        { to: '/self/admin', icon: 'self-service-admin', label: 'selfServiceAdminPage' }
      ]},
      { to: '/backup', icon: 'backup', label: 'backupPage' },
      { to: '/update', icon: 'update', label: 'updatePage' },
      { to: '/settings', icon: 'settings', label: 'settingsPage', subMenu: [
        { to: '/settings/servers', icon: 'settings-servers', label: 'settingsServersPage' },
        { to: '/settings/users', icon: 'settings-users', label: 'settingsUsersPage' },
        { to: '/settings/groups', icon: 'settings-groups', label: 'settingsGroupsPage' },
        { to: '/settings/acls', icon: 'settings-acls', label: 'settingsAclsPage' },
        { to: '/settings/plugins', icon: 'settings-plugins', label: 'settingsPluginsPage' }
      ]},
      { to: '/about', icon: 'about', label: 'aboutPage' },
      { to: '/create', icon: 'create', label: 'createMenu' }
    ]
    return <div className={classNames(
      `xo-menu${collapsed ? '-collapsed' : ''}`
    )}>
      <div className='xo-collapse-item'>
        <Button className='btn-collapse' onClick={() => setCollapse(!collapsed)}>
          <Icon icon='menu-collapse' />
        </Button>
      </div>
      <ul className='nav nav-sidebar nav-pills nav-stacked'>
        {map(items, (item, index) =>
          <MenuLinkItem key={index} item={item} collapsed={collapsed}/>
        )}
      </ul>

    </div>
  }
}

class MenuLinkItem extends Component {
  componentWillMount () {
    this.setState({showSubMenu: false})
  }
  render () {
    const { item, collapsed } = this.props
    const { to, icon, label, subMenu } = item
    const [ LinkComponent, path ] = to === '/home'
      ? [ IndexLink, '/' ] : [ Link, to ]

    return <li
      className='nav-item xo-menu-item'
      onMouseEnter={() => this.setState({showSubMenu: true})}
      onMouseLeave={() => this.setState({showSubMenu: false})}
    >
      <LinkComponent activeClassName='xo-menu-item-selected' className='nav-link' to={path}>
        <Icon icon={`menu-${icon}`} size='lg' fixedWidth/>
        {!collapsed && <span>&nbsp;&nbsp;&nbsp;</span>}
        {!collapsed && _(label)}
      </LinkComponent>
      {subMenu && this.state.showSubMenu && <SubMenu collapsed={collapsed} items={subMenu}/>}
    </li>
  }
}

const SubMenu = (props) => {
  return <ul className='nav nav-sidebar nav-pills nav-stacked xo-sub-menu'>
    {map(props.items, (item, index) => {
      const [ LinkComponent, path ] = item.to === 'home'
      ? [ IndexLink, '/' ] : [ Link, item.to ]
      return <li key={index} className='nav-item xo-menu-item'>
        <LinkComponent className='nav-link' to={path}>
          <Icon icon={`menu-${item.icon}`} size='lg' fixedWidth/>&nbsp;&nbsp;&nbsp;
          {_(item.label)}
        </LinkComponent>
      </li>
    })}
  </ul>
}
