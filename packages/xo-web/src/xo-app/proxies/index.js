import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { adminOnly } from 'utils'
import { provideState, injectState } from 'reaclette'
import { Text } from 'editable'
import { Vm } from 'render-xo-item'
import { withRouter } from 'react-router'
import {
  checkProxyHealth,
  destroyProxyAppliances,
  editProxyAppliance,
  forgetProxyAppliances,
  getProxyApplianceUpdaterState,
  subscribeProxies,
  upgradeProxyAppliance,
} from 'xo'

import Page from '../page'

import deployProxy from './deploy-proxy'
import { updateApplianceSettings } from './update-appliance-settings'

const _editProxy = (value, { name, proxy }) => editProxyAppliance(proxy, { [name]: value })

const HEADER = (
  <h2>
    <Icon icon='proxy' /> {_('proxies')}
  </h2>
)

const ACTIONS = [
  {
    handler: forgetProxyAppliances,
    icon: 'forget',
    label: _('forgetProxies'),
    level: 'danger',
  },
  {
    handler: destroyProxyAppliances,
    icon: 'destroy',
    label: _('destroyProxies'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: (proxy, { deployProxy }) =>
      deployProxy({
        proxy,
      }),
    icon: 'refresh',
    label: _('redeployProxyAction'),
    level: 'warning',
  },
  {
    handler: checkProxyHealth,
    icon: 'diagnosis',
    label: _('checkProxyHealth'),
    level: 'primary',
  },
  {
    collapsed: true,
    disabled: ({ vmUuid }) => vmUuid === undefined,
    handler: proxy => updateApplianceSettings(proxy),
    icon: 'settings',
    label: _('updateProxyApplianceSettings'),
    level: 'primary',
  },
  {
    handler: ({ id }, { router }) =>
      router.push({
        pathname: '/settings/remotes',
        query: {
          l: `proxy:${id}`,
          nfs: `proxy:${id}`,
          smb: `proxy:${id}`,
        },
      }),
    icon: 'remote',
    label: _('proxyLinkedRemotes'),
  },
  {
    handler: ({ id }, { router }) =>
      router.push({
        pathname: '/backup/overview',
        query: {
          s: `proxy:${id}`,
        },
      }),
    icon: 'backup',
    label: _('proxyLinkedBackups'),
  },
]

const COLUMNS = [
  {
    default: true,
    itemRenderer: proxy => <Text data-name='name' data-proxy={proxy} onChange={_editProxy} value={proxy.name} />,
    name: _('name'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: proxy => <Vm id={proxy.vmUuid} link />,
    name: _('vm'),
  },
  {
    itemRenderer: (proxy, { upgradesByProxy, upgradeAppliance }) => {
      const globalState = upgradesByProxy[proxy.id]
      if (globalState === undefined) {
        return
      }

      const { state } = globalState
      if (state.endsWith('-upgrade-needed')) {
        return (
          <div>
            <ActionButton
              btnStyle='success'
              disabled={proxy.vmUuid === undefined}
              handler={upgradeAppliance}
              handlerParam={proxy.id}
              icon='upgrade'
            >
              {_('upgrade')}
            </ActionButton>
            <p className='text-warning'>
              <Icon icon='alarm' />
              &nbsp;{_('upgradesAvailable')}
            </p>
          </div>
        )
      }

      if (
        state === 'xoa-up-to-date' ||
        state === 'xoa-upgraded' ||
        state === 'updater-upgraded' ||
        state === 'installer-upgraded'
      ) {
        return (
          <ActionButton
            disabled={proxy.vmUuid === undefined}
            handler={upgradeAppliance}
            handlerParam={proxy.id}
            icon='upgrade'
          >
            {_('upgrade')}
          </ActionButton>
        )
      }

      return (
        <div>
          <ActionButton
            btnStyle='success'
            disabled={proxy.vmUuid === undefined}
            handler={upgradeAppliance}
            handlerParam={proxy.id}
            icon='upgrade'
          >
            {_('upgrade')}
          </ActionButton>
          <p className='text-danger'>
            <Icon icon='alarm' />
            &nbsp;{globalState.message}
          </p>
        </div>
      )
    },
    name: _('upgrade'),
  },
]

const Proxies = decorate([
  provideState({
    initialState: () => ({
      upgradesByProxy: {},
    }),
    effects: {
      initialize({ fetchProxyUpgrades }) {
        return fetchProxyUpgrades(this.props.proxies.map(({ id }) => id))
      },
      async fetchProxyUpgrades(effects, proxies) {
        const upgradesByProxy = { ...this.state.upgradesByProxy }
        await Promise.all(
          proxies.map(async id => {
            upgradesByProxy[id] = await getProxyApplianceUpdaterState(id).catch(e => ({
              state: 'error',
              message: _('proxyUpgradesError'),
            }))
          })
        )
        this.state.upgradesByProxy = upgradesByProxy
      },
      async deployProxy({ fetchProxyUpgrades }, proxy) {
        return fetchProxyUpgrades([await deployProxy(proxy)])
      },
      async upgradeAppliance({ fetchProxyUpgrades }, id) {
        await upgradeProxyAppliance(id)
        return fetchProxyUpgrades([id])
      },
    },
  }),
  withRouter,
  injectState,
  ({ effects, proxies, router, state }) => (
    <Page header={HEADER} title='proxies' formatTitle>
      <div>
        <div className='mt-1 mb-1'>
          <ActionButton btnStyle='success' handler={effects.deployProxy} icon='proxy' size='large'>
            {_('deployProxy')}
          </ActionButton>
        </div>
        <NoObjects
          actions={ACTIONS}
          collection={proxies}
          columns={COLUMNS}
          component={SortedTable}
          data-deployProxy={effects.deployProxy}
          data-router={router}
          data-upgradesByProxy={state.upgradesByProxy}
          data-upgradeAppliance={effects.upgradeAppliance}
          emptyMessage={
            <span className='text-muted'>
              <Icon icon='alarm' />
              &nbsp;
              {_('noProxiesAvailable')}
            </span>
          }
          individualActions={INDIVIDUAL_ACTIONS}
          stateUrlParam='s'
        />
      </div>
    </Page>
  ),
])

export default decorate([
  adminOnly,
  addSubscriptions({
    proxies: subscribeProxies,
  }),
  ({ proxies }) => (proxies === undefined ? _('statusLoading') : <Proxies proxies={proxies} />),
])
