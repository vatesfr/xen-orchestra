import _ from 'intl'
import classNames from 'classnames'
import Component from 'base-component'
import Icon, { StackedIcons } from 'icon'
import Link from 'link'
import React from 'react'
import Tooltip from 'tooltip'
import { injectState } from 'reaclette'
import { UpdateTag } from '../xoa/update'
import { NotificationTag } from '../xoa/notifications'
import { addSubscriptions, connectStore, getXoaPlan, noop } from 'utils'
import {
  connect,
  signOut,
  subscribeHostMissingPatches,
  subscribeNotifications,
  subscribePermissions,
  subscribeProxies,
  subscribeProxiesApplianceUpdaterState,
  subscribeResourceSets,
  subscribeSrsUnhealthyVdiChainsLength,
  VDIS_TO_COALESCE_LIMIT,
} from 'xo'
import {
  createFilter,
  createGetObjectsOfType,
  createSelector,
  getIsPoolAdmin,
  getResolvedPendingTasks,
  getStatus,
  getUser,
  getXoaState,
  isAdmin,
} from 'selectors'
import { every, forEach, identity, isEmpty, isEqual, map, pick, size, some } from 'lodash'

import styles from './index.css'

const LINK_STYLE = {
  display: 'flex',
}

const returnTrue = () => true

@connectStore(
  () => {
    const getHosts = createGetObjectsOfType('host')
    return (state, props) => ({
      hosts: getHosts(state, props),
      isAdmin: isAdmin(state, props),
      isPoolAdmin: getIsPoolAdmin(state, props),
      nHosts: getHosts.count()(state, props),
      // true: useResourceSet to bypass permissions
      nResolvedTasks: getResolvedPendingTasks(state, props, true).length,
      pools: createGetObjectsOfType('pool')(state, props),
      srs: createGetObjectsOfType('SR')(state, props),
      status: getStatus(state, props),
      user: getUser(state, props),
      xoaState: getXoaState(state, props),
    })
  },
  {
    withRef: true,
  }
)
@addSubscriptions({
  notifications: subscribeNotifications,
  permissions: subscribePermissions,
  proxyIds: cb =>
    subscribeProxies(proxies => {
      cb(map(proxies, 'id').sort())
    }),
  resourceSets: subscribeResourceSets,
  unhealthyVdiChainsLength: subscribeSrsUnhealthyVdiChainsLength,
})
@injectState
export default class Menu extends Component {
  componentWillMount() {
    const updateCollapsed = () => {
      this.setState({ collapsed: window.innerWidth < 1200 })
    }
    updateCollapsed()

    window.addEventListener('resize', updateCollapsed)
    this._removeListener = () => {
      window.removeEventListener('resize', updateCollapsed)
      this._removeListener = noop
    }

    this._updateMissingPatchesSubscriptions()
    this._updateProxiesSubscriptions()
  }

  componentWillUnmount() {
    this._removeListener()
    this._unsubscribeMissingPatches()
    this._unsubscribeProxiesApplianceUpdaterState()
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(Object.keys(prevProps.hosts).sort(), Object.keys(this.props.hosts).sort())) {
      this._updateMissingPatchesSubscriptions()
    }

    if (!isEqual(prevProps.proxyIds, this.props.proxyIds)) {
      this._updateProxiesSubscriptions()
    }
  }

  _areProxiesOutOfDate = createSelector(
    () => this.state.proxyStates,
    proxyStates => some(proxyStates, state => state.endsWith('-upgrade-needed'))
  )

  _checkPermissions = createSelector(
    () => this.props.isAdmin,
    () => this.props.permissions,
    (isAdmin, permissions) =>
      isAdmin ? returnTrue : ({ id }) => permissions && permissions[id] && permissions[id].operate
  )

  _getNoOperatablePools = createSelector(
    createFilter(() => this.props.pools, this._checkPermissions),
    isEmpty
  )

  _getNoResourceSets = createSelector(() => this.props.resourceSets, isEmpty)

  _getNoNotifications = createSelector(
    () => this.props.notifications,
    notifications => every(notifications, { read: true })
  )

  get height() {
    return this.refs.content.offsetHeight
  }

  _hasMissingPatches = createSelector(
    () => this.state.missingPatches,
    missingPatches => some(missingPatches, _ => _)
  )

  _hasUnhealthyVdis = createSelector(
    () => this.state.unhealthyVdiChainsLength,
    unhealthyVdiChainsLength =>
      some(unhealthyVdiChainsLength, vdiChainsLength => size(vdiChainsLength) >= VDIS_TO_COALESCE_LIMIT)
  )

  _toggleCollapsed = event => {
    event.preventDefault()
    this._removeListener()
    this.setState({ collapsed: !this.state.collapsed })
  }

  _connect = event => {
    event.preventDefault()
    return connect()
  }

  _signOut = event => {
    event.preventDefault()
    return signOut()
  }

  _updateMissingPatchesSubscriptions = () => {
    this.setState(({ missingPatches }) => ({
      missingPatches: pick(missingPatches, Object.keys(this.props.hosts)),
    }))

    const unsubs = map(this.props.hosts, host =>
      subscribeHostMissingPatches(host, patches => {
        this.setState(state => ({
          missingPatches: {
            ...state.missingPatches,
            [host.id]: patches.length > 0,
          },
        }))
      })
    )

    if (this._unsubscribeMissingPatches !== undefined) {
      this._unsubscribeMissingPatches()
    }

    this._unsubscribeMissingPatches = () => forEach(unsubs, unsub => unsub())
  }

  _updateProxiesSubscriptions = () => {
    this.setState(({ proxyStates }) => ({
      proxyStates: pick(proxyStates, this.props.proxyIds),
    }))

    const unsubs = map(this.props.proxyIds, proxyId =>
      subscribeProxiesApplianceUpdaterState(proxyId, ({ state: proxyState = '' }) => {
        this.setState(state => ({
          proxyStates: {
            ...state.proxyStates,
            [proxyId]: proxyState,
          },
        }))
      })
    )

    if (this._unsubscribeProxiesApplianceUpdaterState !== undefined) {
      this._unsubscribeProxiesApplianceUpdaterState()
    }

    this._unsubscribeProxiesApplianceUpdaterState = () => forEach(unsubs, unsub => unsub())
  }

  render() {
    const { isAdmin, isPoolAdmin, nResolvedTasks, state, status, user, pools, nHosts, srs, xoaState } = this.props
    const noOperatablePools = this._getNoOperatablePools()
    const noResourceSets = this._getNoResourceSets()
    const noNotifications = this._getNoNotifications()

    const missingPatchesWarning = this._hasMissingPatches() ? (
      <Tooltip content={_('homeMissingPatches')}>
        <span className='text-warning'>
          <Icon icon='alarm' />
        </span>
      </Tooltip>
    ) : null

    const unhealthyVdisWarning = this._hasUnhealthyVdis() ? (
      <Tooltip content={_('homeUnhealthyVdis')}>
        <span className='text-warning'>
          <Icon icon='alarm' />
        </span>
      </Tooltip>
    ) : null

    /* eslint-disable object-property-newline */
    const items = [
      {
        to: '/home',
        icon: 'menu-home',
        label: 'homePage',
        extra: [missingPatchesWarning],
        subMenu: [
          { to: '/home?t=VM', icon: 'vm', label: 'homeVmPage' },
          nHosts !== 0 && {
            to: '/home?t=host',
            icon: 'host',
            label: 'homeHostPage',
          },
          !isEmpty(pools) && {
            to: '/home?t=pool',
            icon: 'pool',
            label: 'homePoolPage',
            extra: [missingPatchesWarning],
          },
          isAdmin && {
            to: '/home?t=VM-template',
            icon: 'template',
            label: 'homeTemplatePage',
          },
          !isEmpty(srs) && {
            to: '/home?t=SR',
            icon: 'sr',
            label: 'homeSrPage',
          },
        ],
      },
      {
        to: '/dashboard/overview',
        icon: 'menu-dashboard',
        label: 'dashboardPage',
        extra: [unhealthyVdisWarning],
        subMenu: [
          {
            to: '/dashboard/overview',
            icon: 'menu-dashboard-overview',
            label: 'overviewDashboardPage',
          },
          {
            to: '/dashboard/visualizations',
            icon: 'menu-dashboard-visualization',
            label: 'overviewVisualizationDashboardPage',
          },
          {
            to: '/dashboard/stats',
            icon: 'menu-dashboard-stats',
            label: 'overviewStatsDashboardPage',
          },
          {
            to: '/dashboard/health',
            icon: 'menu-dashboard-health',
            label: 'overviewHealthDashboardPage',
            extra: [unhealthyVdisWarning],
          },
        ],
      },
      isAdmin && {
        to: '/self',
        icon: 'menu-self-service',
        label: 'selfServicePage',
      },
      isAdmin && {
        to: '/backup/overview',
        icon: 'menu-backup',
        label: 'backupPage',
        subMenu: [
          {
            to: '/backup/overview',
            icon: 'menu-backup-overview',
            label: 'backupOverviewPage',
          },
          {
            to: '/backup/new',
            icon: 'menu-backup-new',
            label: 'backupNewPage',
          },
          {
            to: '/backup/restore',
            icon: 'menu-backup-restore',
            label: 'backupRestorePage',
          },
          {
            to: '/backup/file-restore',
            icon: 'menu-backup-file-restore',
            label: 'backupFileRestorePage',
          },
          {
            to: '/backup/health',
            icon: 'menu-dashboard-health',
            label: 'overviewHealthDashboardPage',
          },
        ],
      },
      {
        to: isAdmin ? 'xoa/update' : 'xoa/notifications',
        icon: 'menu-xoa',
        label: 'xoa',
        extra: [
          !isAdmin || xoaState === 'upToDate' ? null : <UpdateTag key='update' />,
          noNotifications ? null : <NotificationTag key='notification' />,
        ],
        subMenu: [
          isAdmin && {
            to: 'xoa/update',
            icon: 'menu-update',
            label: 'updatePage',
            extra: <UpdateTag />,
          },
          isAdmin && {
            to: 'xoa/licenses',
            icon: 'menu-license',
            label: 'licensesPage',
          },
          {
            to: 'xoa/notifications',
            icon: 'menu-notification',
            label: 'notificationsPage',
            extra: <NotificationTag />,
          },
          isAdmin && {
            to: 'xoa/support',
            icon: 'menu-support',
            label: 'supportPage',
          },
        ],
      },
      isAdmin && {
        to: '/settings/servers',
        icon: 'menu-settings',
        label: 'settingsPage',
        subMenu: [
          {
            to: '/settings/servers',
            icon: 'menu-settings-servers',
            label: 'settingsServersPage',
          },
          {
            to: '/settings/users',
            icon: 'menu-settings-users',
            label: 'settingsUsersPage',
          },
          {
            to: '/settings/groups',
            icon: 'menu-settings-groups',
            label: 'settingsGroupsPage',
          },
          {
            to: '/settings/acls',
            icon: 'menu-settings-acls',
            label: 'settingsAclsPage',
          },
          {
            to: '/settings/remotes',
            icon: 'menu-backup-remotes',
            label: 'backupRemotesPage',
          },
          {
            to: '/settings/plugins',
            icon: 'menu-settings-plugins',
            label: 'settingsPluginsPage',
          },
          {
            to: '/settings/logs',
            icon: 'menu-settings-logs',
            label: 'settingsLogsPage',
          },
          {
            to: '/settings/audit',
            icon: 'audit',
            label: 'settingsAuditPage',
          },
          { to: '/settings/ips', icon: 'ip', label: 'settingsIpsPage' },
          {
            to: '/settings/cloud-configs',
            icon: 'template',
            label: 'settingsCloudConfigsPage',
          },
          {
            to: '/settings/config',
            icon: 'menu-settings-config',
            label: 'settingsConfigPage',
          },
        ],
      },
      isAdmin && {
        to: '/jobs/overview',
        icon: 'menu-jobs',
        label: 'jobsPage',
        subMenu: [
          {
            to: '/jobs/overview',
            icon: 'menu-jobs-overview',
            label: 'jobsOverviewPage',
          },
          { to: '/jobs/new', icon: 'menu-jobs-new', label: 'jobsNewPage' },
          {
            to: '/jobs/schedules',
            icon: 'menu-jobs-schedule',
            label: 'jobsSchedulingPage',
          },
        ],
      },
      isAdmin && {
        to: '/hub/templates',
        icon: 'menu-hub',
        label: 'hubPage',
        subMenu: [
          {
            to: '/hub/templates',
            icon: 'hub-template',
            label: 'templatesLabel',
          },
          {
            to: '/hub/recipes',
            icon: 'hub-recipe',
            label: 'recipesLabel',
          },
        ],
      },
      isAdmin && {
        to: '/proxies',
        icon: 'proxy',
        label: 'proxies',
        extra: [
          this._areProxiesOutOfDate() ? (
            <Tooltip content={_('proxiesNeedUpgrade')}>
              <StackedIcons
                icons={[
                  { color: 'text-success', icon: 'circle', size: 2 },
                  { icon: 'menu-update', size: 1 },
                ]}
              />
            </Tooltip>
          ) : null,
        ],
      },
      isAdmin && { to: '/about', icon: 'menu-about', label: 'aboutPage' },
      {
        to: '/tasks',
        icon: 'task',
        label: 'taskMenu',
        pill: nResolvedTasks,
      },
      isAdmin && { to: '/xosan', icon: 'menu-xosan', label: 'xosan' },
      !noOperatablePools && {
        to: '/import/vm',
        icon: 'menu-new-import',
        label: 'newImport',
        subMenu: [
          {
            to: '/import/vm',
            icon: 'vm',
            label: 'labelVm',
          },
          {
            to: '/import/disk',
            icon: 'disk',
            label: 'labelDisk',
          },
          {
            to: '/import/vmware',
            icon: 'vm',
            label: 'fromVmware',
          },
        ],
      },
      !(noOperatablePools && noResourceSets) && {
        to: '/vms/new',
        icon: 'menu-new',
        label: 'newMenu',
        subMenu: [
          (isAdmin || (isPoolAdmin && process.env.XOA_PLAN > 3) || !noResourceSets) && {
            to: '/vms/new',
            icon: 'menu-new-vm',
            label: 'newVmPage',
          },
          isAdmin && { to: '/new/sr', icon: 'menu-new-sr', label: 'newSrPage' },
          isPoolAdmin && {
            to: '/new/network',
            icon: 'menu-new-network',
            label: 'newNetworkPage',
          },
          isAdmin && {
            to: '/settings/servers',
            icon: 'menu-settings-servers',
            label: 'newServerPage',
          },
        ],
      },
    ]
    /* eslint-enable object-property-newline */

    return (
      <div className={classNames('xo-menu', this.state.collapsed && styles.collapsed)}>
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
            <a className='nav-link' onClick={this._toggleCollapsed} href='#'>
              <Icon icon='menu-collapse' size='lg' fixedWidth />
            </a>
          </li>
          {map(items, (item, index) => item && <MenuLinkItem key={index} item={item} />)}
          <li>&nbsp;</li>
          <li>&nbsp;</li>
          {!state.isXoaStatusOk && (
            <li className='nav-item xo-menu-item'>
              <Link className='nav-link' style={LINK_STYLE} to='/xoa/support'>
                <span className={classNames(styles.hiddenCollapsed, 'text-warning')}>
                  <Icon icon='diagnosis' size='lg' fixedWidth /> {_('checkXoa')}
                </span>
                <span className={classNames(styles.hiddenUncollapsed, 'text-warning')}>
                  <Icon icon='diagnosis' size='lg' fixedWidth />
                </span>
              </Link>
            </li>
          )}
          {(isAdmin || +process.env.XOA_PLAN === 5) && (
            <li className='nav-item xo-menu-item'>
              <Link className='nav-link' style={{ display: 'flex' }} to='/about'>
                {+process.env.XOA_PLAN === 5 ? (
                  <span>
                    <span className={classNames(styles.hiddenCollapsed, 'text-warning')}>
                      <Icon icon='alarm' size='lg' fixedWidth /> {_('noSupport')}
                    </span>
                    <span className={classNames(styles.hiddenUncollapsed, 'text-warning')}>
                      <Icon icon='alarm' size='lg' fixedWidth />
                    </span>
                  </span>
                ) : +process.env.XOA_PLAN === 1 ? (
                  <span>
                    <span className={classNames(styles.hiddenCollapsed, 'text-warning')}>
                      <Icon icon='info' size='lg' fixedWidth /> {_('freeUpgrade')}
                    </span>
                    <span className={classNames(styles.hiddenUncollapsed, 'text-warning')}>
                      <Icon icon='info' size='lg' fixedWidth />
                    </span>
                  </span>
                ) : (
                  <span>
                    <span className={classNames(styles.hiddenCollapsed, 'text-success')}>
                      <Icon icon='info' size='lg' fixedWidth /> {getXoaPlan()}
                    </span>
                    <span className={classNames(styles.hiddenUncollapsed, 'text-success')}>
                      <Icon icon='info' size='lg' fixedWidth />
                    </span>
                  </span>
                )}
              </Link>
            </li>
          )}
          <li>&nbsp;</li>
          <li>&nbsp;</li>
          <li className='nav-item xo-menu-item'>
            <a className='nav-link' onClick={this._signOut} href='#'>
              <Icon icon='sign-out' size='lg' fixedWidth />
              <span className={styles.hiddenCollapsed}> {_('signOut')}</span>
            </a>
          </li>
          <li className='nav-item xo-menu-item'>
            <Link className='nav-link text-xs-center' to='/user'>
              <Tooltip
                content={_('editUserProfile', {
                  username: user ? user.email : '',
                })}
              >
                <Icon icon='user' size='lg' />
              </Tooltip>
            </Link>
          </li>
          <li>&nbsp;</li>
          <li>&nbsp;</li>
          {status === 'connecting' ? (
            <li className='nav-item text-xs-center'>{_('statusConnecting')}</li>
          ) : (
            status === 'disconnected' && (
              <li className='nav-item text-xs-center xo-menu-item'>
                <a className='nav-link' onClick={this._connect} href='#'>
                  <Icon icon='alarm' size='lg' fixedWidth /> {_('statusDisconnected')}
                </a>
              </li>
            )
          )}
        </ul>
      </div>
    )
  }
}

const MenuLinkItem = props => {
  const { item } = props
  const { to, icon, label, subMenu, pill, extra } = item
  const _extra = extra !== undefined ? extra.find(e => e !== null) : undefined

  return (
    <li className='nav-item xo-menu-item'>
      <Link activeClassName='active' className={classNames('nav-link', styles.centerCollapsed)} to={to}>
        <Icon
          className={classNames((pill || _extra) && styles.hiddenCollapsed)}
          icon={`${icon}`}
          size='lg'
          fixedWidth
        />
        <span className={styles.hiddenCollapsed}>
          {' '}
          {typeof label === 'string' ? _(label) : label}
          &nbsp;
        </span>
        {pill > 0 && <span className='tag tag-pill tag-primary'>{pill}</span>}
        <span className={styles.hiddenUncollapsed}>{_extra}</span>
        <span className={styles.hiddenCollapsed}>{extra !== undefined && extra.map(identity)}</span>
      </Link>
      {subMenu && <SubMenu items={subMenu} />}
    </li>
  )
}

const SubMenu = props => {
  return (
    <ul className='nav nav-pills nav-stacked xo-sub-menu'>
      {map(
        props.items,
        (item, index) =>
          item && (
            <li key={index} className='nav-item xo-menu-item'>
              <Link activeClassName='active' className='nav-link' to={item.to}>
                <Icon icon={`${item.icon}`} size='lg' fixedWidth /> {_(item.label)} {item.extra}
              </Link>
            </li>
          )
      )}
    </ul>
  )
}
