import _ from 'messages'
import { Button } from 'react-bootstrap-4/lib'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import React, { Component } from 'react'

import Icon from 'icon'

export default class Menu extends Component {
  componentWillMount () {
    this.setState({collapsed: false})
  }
  render () {
    const items = [
      { to: '/home', icon: 'home', label: 'homePage' },
      { to: '/dashboard', icon: 'dashboard', label: 'dashboardPage' },
      { to: '/self', icon: 'self-service', label: 'selfServicePage', subMenu: [
        { to: '/self/dashboard', icon: 'self-service-dashboard', label: 'selfServiceDashboardPage' },
        { to: '/self/admin', icon: 'self-service-admin', label: 'selfServiceAdminPage' }
      ]},
      { to: '/backup', icon: 'backup', label: 'backupPage', subMenu: [
        { to: '/backup/overview', icon: 'backup-overview', label: 'backupOverviewPage' },
        { to: '/backup/new', icon: 'backup-new', label: 'backupNewPage' },
        { to: '/backup/remotes', icon: 'backup-remotes', label: 'backupRemotesPage' },
        { to: '/backup/restore', icon: 'backup-restore', label: 'backupRestorePage' }
      ]},
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
    return <div className='xo-menu'>
      <ul className='nav nav-sidebar nav-pills nav-stacked'>
        <Button onClick={() => this.setState({collapsed: !this.state.collapsed})}>
          <Icon icon='menu-collapse' size='lg' fixedWidth />
        </Button>
        {map(items, (item, index) =>
          <MenuLinkItem key={index} item={item} collapsed={this.state.collapsed}/>
        )}
      </ul>

    </div>
  }
}

const MenuLinkItem = (props) => {
  const { item, collapsed } = props
  const { to, icon, label, subMenu } = item
  const [ LinkComponent, path ] = to === '/home'
    ? [ IndexLink, '/' ] : [ Link, to ]

  return <li className='nav-item xo-menu-item'>
    <LinkComponent activeClassName='active' className='nav-link' to={path}>
      <Icon icon={`menu-${icon}`} size='lg' fixedWidth/>
      {!collapsed && <span>&nbsp;&nbsp;&nbsp;</span>}
      {!collapsed && _(label)}
    </LinkComponent>
    {subMenu && <SubMenu items={subMenu}/>}
  </li>
}

const SubMenu = (props) => {
  return <ul className='nav nav-pills nav-stacked xo-sub-menu'>
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
