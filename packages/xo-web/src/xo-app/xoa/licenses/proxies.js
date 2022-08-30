import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { Proxy, Vm } from 'render-xo-item'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { filter, groupBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { subscribeProxies, bindLicense } from 'xo'

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
    itemRenderer: (proxy, { availableLicenses, licensesByVmUuid, updateLicenses }) => {
      const license = licensesByVmUuid[proxy.vmUuid]?.[0]

      return license !== undefined && license.productId === 'xoproxy' ? (
        license.id.slice(-4)
      ) : (
        <SelectLicense
          licenses={availableLicenses}
          onChange={licenseId => bindLicense(licenseId, proxy.vmUuid).then(updateLicenses)}
          productType='xoproxy'
        />
      )
    },
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
      licensesByVmUuid: (state, { proxyLicenses }) => groupBy(proxyLicenses, 'vmUuid'),
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
