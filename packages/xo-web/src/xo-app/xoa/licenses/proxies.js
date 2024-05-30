import _ from 'intl'
import Component from 'base-component'
import decorate from 'apply-decorators'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import groupBy from 'lodash/groupBy.js'
import { createSelector } from 'selectors'
import { injectState, provideState } from 'reaclette'
import { Proxy, Vm } from 'render-xo-item'
import { subscribeProxies } from 'xo'

import LicenseForm from './license-form'

class ProxyLicensesForm extends Component {
  getAlerts = createSelector(
    () => this.props.item,
    () => this.props.userData,
    (proxy, userData) => {
      const alerts = []
      const licenses = userData.licensesByVmUuid[proxy.vmUuid]

      if (proxy.vmUuid === undefined) {
        alerts.push({
          level: 'danger',
          render: (
            <p>
              {_('proxyUnknownVm')}{' '}
              <a href='https://xen-orchestra.com/' target='_blank' rel='noreferrer'>
                {_('contactUs')}
              </a>
            </p>
          ),
        })
      }

      // Proxy bound to multiple licenses
      if (licenses?.length > 1) {
        alerts.push({
          level: 'danger',
          render: (
            <p>
              {_('proxyMultipleLicenses')}
              <br />
              {licenses.map(license => license.id.slice(-4)).join(',')}
            </p>
          ),
        })
      }
      return alerts
    }
  )

  render() {
    const alerts = this.getAlerts()
    const { item, userData } = this.props
    const licenses = userData.licensesByVmUuid[item.vmUuid]

    const license = licenses?.[0]
    return (
      <LicenseForm
        alerts={alerts}
        item={item}
        itemUuidPath='vmUuid'
        license={license}
        productType='xoproxy'
        userData={userData}
      />
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
