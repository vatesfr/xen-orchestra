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

const _editProxy = (value, { name, proxy }) =>
  editProxyAppliance(proxy, { [name]: value })

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
    itemRenderer: proxy => (
      <Text
        data-name='name'
        data-proxy={proxy}
        onChange={_editProxy}
        value={proxy.name}
      />
    ),
    name: _('name'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: proxy => <Vm id={proxy.vmUuid} link />,
    name: _('vm'),
  },
  {
    itemRenderer: (proxy, { updatesByProxy, upgradeAppliance }) => {
      const globalState = updatesByProxy[proxy.id]
      if (globalState === undefined) {
        return
      }

      const { state } = globalState
      const upgrade = (
        <ActionButton
          btnStyle='success'
          disabled={proxy.vmUuid === undefined}
          handler={upgradeAppliance}
          handlerParam={proxy.id}
          icon='upgrade'
        >
          {_('upgrade')}
        </ActionButton>
      )

      if (state.endsWith('-upgrade-needed')) {
        return (
          <div>
            {upgrade}
            <p className='text-warning'>
              <Icon icon='alarm' />
              &nbsp;{_('upgradeAvailable')}
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
          <div>
            {upgrade}
            <p className='text-success'>
              <Icon icon='success' />
              &nbsp;{_('proxyUpToDate')}
            </p>
          </div>
        )
      }

      return (
        <div>
          {upgrade}
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
      updatesByProxy: {},
    }),
    effects: {
      initialize({ fetchProxyUpdates }) {
        return fetchProxyUpdates(this.props.proxies.map(({ id }) => id))
      },
      async fetchProxyUpdates(effects, proxies) {
        const updatesByProxy = { ...this.state.updatesByProxy }
        await Promise.all(
          proxies.map(async id => {
            updatesByProxy[id] = await getProxyApplianceUpdaterState(id).catch(
              e => ({
                state: 'error',
                message: _('cannotGetProxyUpdates'),
              })
            )
          })
        )
        this.state.updatesByProxy = updatesByProxy
      },
      async deployProxy({ fetchProxyUpdates }, proxy) {
        return fetchProxyUpdates([await deployProxy(proxy)])
      },
      async upgradeAppliance({ fetchProxyUpdates }, id) {
        await upgradeProxyAppliance(id)
        return fetchProxyUpdates([id])
      },
    },
  }),
  withRouter,
  injectState,
  ({ effects, proxies, router, state }) => (
    <Page header={HEADER} title='proxies' formatTitle>
      <div>
        <div className='mt-1 mb-1'>
          <ActionButton
            btnStyle='success'
            handler={effects.deployProxy}
            icon='proxy'
            size='large'
          >
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
          data-updatesByProxy={state.updatesByProxy}
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
  ({ proxies }) =>
    proxies === undefined ? _('statusLoading') : <Proxies proxies={proxies} />,
])
