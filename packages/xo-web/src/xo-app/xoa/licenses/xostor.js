import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import { bindLicense } from 'xo'
import { connectStore } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { groupBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { Pool, Sr } from 'render-xo-item'

import BulkIcons from '../../../common/bulk-icons'

class XostorLicensesForm extends Component {
  state = {
    licenseId: 'none',
  }

  bind = () => {
    const { item, userData } = this.props
    return bindLicense(this.state.licenseId, item.uuid).then(userData.updateLicenses)
  }

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
    if (alerts.length > 0) {
      return <BulkIcons alerts={alerts} />
    }

    const { item, userData } = this.props
    const { licenseId } = this.state
    const licenses = userData.licensesByXostorUuid[item.id]
    const license = licenses?.[0]

    return license !== undefined ? (
      <span>{license?.id.slice(-4)}</span>
    ) : (
      <div>
        {license !== undefined && (
          <div className='text-danger mb-1'>
            <Icon icon='alarm' /> {_('licenseHasExpired')}
          </div>
        )}
        <form className='form-inline'>
          <SelectLicense onChange={this.linkState('licenseId')} productType='xostor' />
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
      </div>
    )
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
