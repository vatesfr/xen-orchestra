import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { adminOnly } from 'utils'
import { form } from 'modal'
import { SelectSr } from 'select-objects'
import { Text, XoSelect } from 'editable'
import { Vm } from 'render-xo-item'
import {
  checkProxyHealth,
  deployProxyAppliance,
  destroyProxyAppliances,
  forgetProxyAppliances,
  setProxyAppliance,
  subscribeProxies,
} from 'xo'

import Page from '../page'

const _deployProxy = () =>
  form({
    render: ({ onChange, value }) => (
      <SelectSr onChange={onChange} value={value} required />
    ),
    header: (
      <span>
        <Icon icon='proxy' /> {_('deployProxy')}
      </span>
    ),
  }).then(deployProxyAppliance)

const _editProxy = (value, { name, proxy }) =>
  setProxyAppliance(proxy, { [name]: value })

const HEADER = (
  <h2>
    <Icon icon='proxy' /> {_('proxies')}
  </h2>
)

const Actions = [
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
    handler: checkProxyHealth,
    icon: 'diagnosis',
    label: _('checkProxyHealth'),
    level: 'primary',
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
        value={defined(proxy.name, '')}
      />
    ),
    name: _('name'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: proxy => (
      <Text
        data-name='address'
        data-proxy={proxy}
        onChange={_editProxy}
        value={defined(proxy.address, '')}
      />
    ),
    name: _('address'),
    sortCriteria: 'address',
  },
  {
    itemRenderer: proxy => (
      <XoSelect
        onChange={value => _editProxy(value, { name: 'vm', proxy })}
        value={proxy.vmUuid}
        xoType='VM'
      >
        {proxy.vmUuid !== undefined ? (
          <div>
            <Vm id={proxy.vmUuid} />{' '}
            <a
              role='button'
              onClick={() => _editProxy(null, { name: 'vm', proxy })}
            >
              <Icon icon='remove' />
            </a>
          </div>
        ) : (
          _('noValue')
        )}
      </XoSelect>
    ),
    name: _('vm'),
    sortCriteria: 'vm',
  },
]

export default decorate([
  adminOnly,
  addSubscriptions({
    proxies: subscribeProxies,
  }),
  ({ proxies }) => (
    <Page header={HEADER} title='proxies' formatTitle>
      <div>
        <div className='mt-1 mb-1'>
          <ActionButton
            btnStyle='success'
            handler={_deployProxy}
            icon='proxy'
            size='large'
          >
            {_('deployProxy')}
          </ActionButton>
        </div>
        <NoObjects
          actions={Actions}
          collection={proxies}
          columns={COLUMNS}
          component={SortedTable}
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
