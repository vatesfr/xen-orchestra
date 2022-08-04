import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { Vm } from 'render-xo-item'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { filter, groupBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { subscribeProxies, unlock } from 'xo'

const COLUMNS = [
  {
    default: true,
    itemRenderer: proxy => <span>{proxy.name}</span>,
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
      const license = licensesByVmUuid[proxy.vmUuid][0]

      return license !== undefined && license.productId === 'xoproxy' ? (
        license.id.slice(-4)
      ) : (
        <SelectLicense
          licenses={availableLicenses}
          onChange={licenseId => unlock(licenseId, proxy).then(updateLicenses)}
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
      proxiesWithExpiredLicense: (state, { proxies, licensesByVmUuid }) => {
        filter(proxies, proxy => {
          const license = licensesByVmUuid[proxy.vmUuid][0]
          return license === undefined ? true : license.expires !== undefined || license.expires < Date.now()
        })
      },
    },
  }),
  injectState,
  ({ state, updateLicenses }) => (
    <SortedTable
      collection={state.proxiesWithExpiredLicense}
      columns={COLUMNS}
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s_proxies'
      data-availableLicenses={state.availableLicenses}
      data-licensesByVmUuid={state.licensesByVmUuid}
      data-updateLicenses={updateLicenses}
    />
  ),
])
export default Proxies
