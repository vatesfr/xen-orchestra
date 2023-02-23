import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import groupBy from 'lodash/groupBy.js'
import { injectState, provideState } from 'reaclette'
import { Proxy, Vm } from 'render-xo-item'
import { subscribeProxies, bindLicense } from 'xo'

class ProxyLicensesForm extends Component {
  state = {
    licenseId: 'none',
  }

  onChangeLicense = event => {
    this.setState({ licenseId: event.target.value })
  }

  bind = () => {
    const { item, userData } = this.props
    return bindLicense(this.state.licenseId, item.vmUuid).then(userData.updateLicenses)
  }

  render() {
    const { item, userData } = this.props
    const { licenseId } = this.state
    const licenses = userData.licensesByVmUuid[item.vmUuid]

    if (item.vmUuid === undefined) {
      return (
        <span className='text-danger'>
          {_('proxyUnknownVm')} <a href='https://xen-orchestra.com/'>{_('contactUs')}</a>
        </span>
      )
    }

    // Proxy bound to multiple licenses
    if (licenses?.length > 1) {
      return (
        <div>
          <span>{licenses.map(license => license.id.slice(-4)).join(',')}</span>{' '}
          <Tooltip content={_('proxyMultipleLicenses')}>
            <Icon color='text-danger' icon='alarm' />
          </Tooltip>
        </div>
      )
    }

    const license = licenses?.[0]
    return license !== undefined ? (
      <span>{license.id.slice(-4)}</span>
    ) : (
      <form className='form-inline'>
        <SelectLicense onChange={this.onChangeLicense} productType='xoproxy' />
        <ActionButton
          btnStyle='primary'
          className='ml-1'
          disabled={licenseId === 'none'}
          handler={this.bind}
          handlerParam={licenseId}
          icon='connect'
        >
          {_('bindLicense')}
        </ActionButton>
      </form>
    )
  }
}

const COLUMNS = [
  {
    default: true,
    itemRenderer: proxy => <Proxy id={proxy.id} link newTab />,
    name: _('name'),
    sortCriteria: 'name',
  },
  {
    itemRenderer: proxy => <Vm id={proxy.vmUuid} link />,
    name: _('vm'),
  },
  {
    name: _('license'),
    component: ProxyLicensesForm,
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    label: _('productSupport'),
    icon: 'support',
    handler: () => window.open('https://xen-orchestra.com'),
  },
]

const Proxies = decorate([
  addSubscriptions({
    proxies: subscribeProxies,
  }),
  provideState({
    computed: {
      licensesByVmUuid: (state, { proxyLicenses }) => groupBy(proxyLicenses, 'boundObjectId'),
    },
  }),
  injectState,
  ({ state, proxies, updateLicenses }) => (
    <SortedTable
      collection={proxies}
      columns={COLUMNS}
      data-licensesByVmUuid={state.licensesByVmUuid}
      data-updateLicenses={updateLicenses}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s_proxies'
    />
  ),
])
export default Proxies
