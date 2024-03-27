import _ from 'intl'
import Component from 'base-component'
import decorate from 'apply-decorators'
import React from 'react'
import SortedTable from 'sorted-table'
import { connectStore } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { groupBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { Pool, Sr } from 'render-xo-item'

import LicenseForm from './license-form'

class XostorLicensesForm extends Component {
  getAlerts = createSelector(
    () => this.props.item,
    () => this.props.userData,
    (sr, userData) => {
      const alerts = []
      const licenses = userData.licensesByXostorUuid[sr.id]

      // Xostor bound to multiple licenses
      if (licenses?.length > 1) {
        alerts.push({
          level: 'danger',
          render: (
            <p>
              {_('xostorMultipleLicenses')}
              <br />
              {licenses.map(license => license.id.slice(-4)).join(',')}
            </p>
          ),
        })
      }

      const license = licenses?.[0]
      if (license?.expires < Date.now()) {
        alerts.push({
          level: 'danger',
          render: _('licenseExpiredXostorWarning', { licenseId: license?.id.slice(-4) }),
        })
      }
      return alerts
    }
  )

  render() {
    const alerts = this.getAlerts()

    const { item, userData } = this.props
    const licenses = userData.licensesByXostorUuid[item.id]
    const license = licenses?.[0]

    return <LicenseForm alerts={alerts} item={item} license={license} productType='xostor' userData={userData} />
  }
}

const INDIVIDUAL_ACTIONS = [
  {
    label: _('productSupport'),
    icon: 'support',
    handler: () => window.open('https://xen-orchestra.com'),
  },
]

const COLUMNS = [
  {
    default: true,
    name: _('name'),
    itemRenderer: sr => <Sr id={sr.id} link container={false} />,
    sortCriteria: 'name_label',
  },
  { name: _('pool'), itemRenderer: sr => <Pool id={sr.$pool} link /> },
  { name: _('license'), component: XostorLicensesForm },
]
const Xostor = decorate([
  connectStore(() => ({
    xostorSrs: createGetObjectsOfType('SR').filter([({ SR_type }) => SR_type === 'linstor']),
  })),
  provideState({
    computed: {
      licensesByXostorUuid: (state, { xostorLicenses }) => groupBy(xostorLicenses, 'boundObjectId'),
    },
  }),
  injectState,
  ({ state, xostorSrs, updateLicenses }) => (
    <SortedTable
      collection={xostorSrs}
      columns={COLUMNS}
      data-updateLicenses={updateLicenses}
      data-licensesByXostorUuid={state.licensesByXostorUuid}
      individualActions={INDIVIDUAL_ACTIONS}
    />
  ),
])

export default Xostor
