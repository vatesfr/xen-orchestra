import _ from 'messages'
import Component from 'base-component'
import classNames from 'classnames'
import Icon from 'icon'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import React from 'react'
import Tooltip from 'tooltip'
import { Button } from 'react-bootstrap-4/lib'
import { connectStore, noop, getXoaPlan } from 'utils'
import { createGetObjectsOfType, getLang, getUser } from 'selectors'
import { signOut } from 'xo'

import styles from './index.css'

@connectStore(() => ({
  // FIXME: remove when fixed in React.
  //
  // There are currently issues between context updates (used by
  // react-intl) and pure components.
  lang: getLang,

  nTasks: createGetObjectsOfType('task').count(
    [ task => task.status === 'pending' ]
  ),
  user: getUser
}), {
  withRef: true
})
export default class Menu extends Component {
  componentWillMount () {
    const updateCollapsed = () => {
      this.setState({ collapsed: window.innerWidth < 1200 })
    }
    updateCollapsed()

    window.addEventListener('resize', updateCollapsed)
    this._removeListener = () => {
      window.removeEventListener('resize', updateCollapsed)
      this._removeListener = noop
    }
  }

  componentWillUnmount () {
    this._removeListener()
  }

  get height () {
    return this.refs.content.offsetHeight
  }

  _toggleCollapsed = () => {
    this._removeListener()
    this.setState({ collapsed: !this.state.collapsed })
  }

  render () {
    const { nTasks, user } = this.props
    const items = [
      { to: '/home', icon: 'menu-home', label: 'homePage' },
      { to: '/dashboard/overview', icon: 'menu-dashboard', label: 'dashboardPage', subMenu: [
        { to: '/dashboard/overview', icon: 'menu-dashboard-overview', label: 'overviewDashboardPage' },
        { to: '/dashboard/visualizations', icon: 'menu-dashboard-visualization', label: 'overviewVisualizationDashboardPage' },
        { to: '/dashboard/stats', icon: 'menu-dashboard-stats', label: 'overviewStatsDashboardPage' },
        { to: '/dashboard/health', icon: 'menu-dashboard-health', label: 'overviewHealthDashboardPage' }
      ]},
      { to: '/self/dashboard', icon: 'menu-self-service', label: 'selfServicePage', subMenu: [
        { to: '/self/dashboard', icon: 'menu-self-service-dashboard', label: 'selfServiceDashboardPage' },
        { to: '/self/admin', icon: 'menu-self-service-admin', label: 'selfServiceAdminPage' }
      ]},
      { to: '/backup/overview', icon: 'menu-backup', label: 'backupPage', subMenu: [
        { to: '/backup/overview', icon: 'menu-backup-overview', label: 'backupOverviewPage' },
        { to: '/backup/new', icon: 'menu-backup-new', label: 'backupNewPage' },
        { to: '/backup/restore', icon: 'menu-backup-restore', label: 'backupRestorePage' }
      ]},
      { to: '/xoa-update', icon: 'menu-update', label: 'updatePage' },
      { to: '/settings/servers', icon: 'menu-settings', label: 'settingsPage', subMenu: [
        { to: '/settings/servers', icon: 'menu-settings-servers', label: 'settingsServersPage' },
        { to: '/settings/users', icon: 'menu-settings-users', label: 'settingsUsersPage' },
        { to: '/settings/groups', icon: 'menu-settings-groups', label: 'settingsGroupsPage' },
        { to: '/settings/acls', icon: 'menu-settings-acls', label: 'settingsAclsPage' },
        { to: '/settings/remotes', icon: 'menu-backup-remotes', label: 'backupRemotesPage' },
        { to: '/settings/plugins', icon: 'menu-settings-plugins', label: 'settingsPluginsPage' }
      ]},
      { to: '/about', icon: 'menu-about', label: 'aboutPage' },
      { to: '/tasks', icon: 'task', label: 'taskMenu', pill: nTasks },
      { to: '/vms/new', icon: 'menu-new', label: 'newMenu', subMenu: [
        { to: '/vms/new', icon: 'menu-new-vm', label: 'newVmPage' },
        { to: '/new/sr', icon: 'menu-new-sr', label: 'newSrPage' },
        { to: '/settings/servers', icon: 'menu-settings-servers', label: 'newServerPage' },
        { to: '/vms/import', icon: 'menu-new-import', label: 'newImport' }
      ]}
    ]

    return <div className={classNames(
      'xo-menu',
      this.state.collapsed && styles.collapsed
    )}>
      <ul className='nav nav-sidebar nav-pills nav-stacked' ref='content'>
        <li>
          <span>
            <a className={styles.brand} href='#'>
              <span className={styles.hiddenUncollapsed}>XO</span>
              <span className={styles.hiddenCollapsed}>Xen Orchestra</span>
            </a>
          </span>
        </li>
        <li>
          <Button onClick={this._toggleCollapsed}>
            <Icon icon='menu-collapse' size='lg' fixedWidth />
          </Button>
        </li>
        {map(items, (item, index) =>
          <MenuLinkItem key={index} item={item} />
        )}
        <li>&nbsp;</li>
        <li>&nbsp;</li>
        <li className='nav-item xo-menu-item'>
          <Link className='nav-link' style={{display: 'flex'}} to={'/about'}>
            {+process.env.XOA_PLAN === 5
              ? <span>
                <span className={classNames(styles.hiddenCollapsed, 'text-warning')}>
                  <Icon icon='alarm' size='lg' fixedWidth /> No support
                </span>
                <span className={classNames(styles.hiddenUncollapsed, 'text-warning')}>
                  <Icon icon='alarm' size='lg' fixedWidth />
                </span>
              </span>
              : +process.env.XOA_PLAN === 1
                ? <span>
                  <span className={classNames(styles.hiddenCollapsed, 'text-warning')}>
                    <Icon icon='info' size='lg' fixedWidth /> Free upgrade!
                  </span>
                  <span className={classNames(styles.hiddenUncollapsed, 'text-warning')}>
                    <Icon icon='info' size='lg' fixedWidth />
                  </span>
                </span>
                : <span>
                  <span className={classNames(styles.hiddenCollapsed, 'text-success')}>
                    <Icon icon='info' size='lg' fixedWidth /> {getXoaPlan()}
                  </span>
                  <span className={classNames(styles.hiddenUncollapsed, 'text-success')}>
                    <Icon icon='info' size='lg' fixedWidth />
                  </span>
                </span>
            }
          </Link>
        </li>
        <li>&nbsp;</li>
        <li>&nbsp;</li>
        <li className='nav-item xo-menu-item'>
          <Button className='nav-link' onClick={signOut}>
            <Icon icon='sign-out' size='lg' fixedWidth />
            <span className={styles.hiddenCollapsed}>{' '}{_('signOut')}</span>
          </Button>
        </li>
        <li className='nav-item'>
          <Link className='nav-link' style={{display: 'flex'}} to={'/user'}>
            <div style={{margin: 'auto'}}>
              <Tooltip content={user ? user.email : ''}>
                <Icon icon='user' size='lg' />
              </Tooltip>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  }
}

const MenuLinkItem = props => {
  const { item } = props
  const { to, icon, label, subMenu, pill } = item

  return <li className='nav-item xo-menu-item'>
    <Link activeClassName='active' className={classNames('nav-link', styles.centerCollapsed)} to={to}>
      <Icon className={classNames(pill && styles.hiddenCollapsed)} icon={`${icon}`} size='lg' fixedWidth />
      <span className={styles.hiddenCollapsed}>{' '}{_(label)}&nbsp;</span>
      {pill > 0 && <span className='tag tag-pill tag-primary'>{pill}</span>}
    </Link>
    {subMenu && <SubMenu items={subMenu} />}
  </li>
}

const SubMenu = props => {
  return <ul className='nav nav-pills nav-stacked xo-sub-menu'>
    {map(props.items, (item, index) => (
      <li key={index} className='nav-item xo-menu-item'>
        <Link activeClassName='active' className='nav-link' to={item.to}>
          <Icon icon={`${item.icon}`} size='lg' fixedWidth />
          {' '}
          {_(item.label)}
        </Link>
      </li>
    ))}
  </ul>
}
