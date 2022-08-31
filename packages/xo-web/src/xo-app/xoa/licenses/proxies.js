import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import React from 'react'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { filter, groupBy } from 'lodash'
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
    const license = userData.licensesByVmUuid[item.vmUuid]?.[0]
    return license?.productId === 'xo-proxy' ? (
      <span>{license.id.slice(-4)}</span>
    ) : (
      <form className='form-inline'>
        <SelectLicense licenses={userData.availableLicenses} onChange={this.onChangeLicense} productType='xoproxy' />
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
      availableLicenses: (state, { proxyLicenses }) =>
        filter(
          proxyLicenses,
          ({ boundObjectId, expires }) => boundObjectId === undefined && (expires === undefined || expires > Date.now())
        ),
      licensesByVmUuid: (state, { proxyLicenses }) => groupBy(proxyLicenses, 'boundObjectId'),
    },
  }),
  injectState,
  ({ state, proxies, updateLicenses }) => (
    <SortedTable
      collection={proxies}
      columns={COLUMNS}
      data-availableLicenses={state.availableLicenses}
      data-licensesByVmUuid={state.licensesByVmUuid}
      data-updateLicenses={updateLicenses}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s_proxies'
    />
  ),
])
export default Proxies
