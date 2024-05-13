import _ from 'intl'
import ActionButton from 'action-button'
import BulkIcons from 'bulk-icons'
import Component from 'base-component'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { bindLicense, rebindLicense } from 'xo'
import { confirm } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { map, filter } from 'lodash'
import { injectState } from 'reaclette'
import { Pool, Sr } from 'render-xo-item'

import BindXostorLicensesModal from './bind-xostor-licenses-modal'

@injectState
class XostorLicensesForm extends Component {
  getLicenseInfo = createSelector(
    () => this.props.item,
    () => this.props.state.xostorLicenseInfoByXostorId,
    (sr, xostorLicenseInfoByXostor) => {
      if (xostorLicenseInfoByXostor === undefined) {
        return
      }
      return xostorLicenseInfoByXostor[sr.id]
    }
  )

  bindXostorLicenses = async () => {
    const {
      item: sr,
      userData: { hosts, xostorLicenses },
    } = this.props

    const now = Date.now()
    const xostorLicenseById = {}
    const xostorLicensesByHost = {}

    xostorLicenses.forEach(license => {
      xostorLicenseById[license.id] = license

      const hostId = license.boundObjectId
      if (hostId !== undefined) {
        if (xostorLicensesByHost[hostId] === undefined) {
          xostorLicensesByHost[hostId] = []
        }
        xostorLicensesByHost[hostId].push(license)
      }
    })

    const hostsWithoutLicense = filter(hosts, host => {
      if (host.$pool !== sr.$pool) {
        return false
      }
      const licenses = xostorLicensesByHost[host.id]
      return licenses === undefined || licenses.every(license => license.expires < now)
    })

    const licenseByHost = await confirm({
      icon: 'connect',
      title: _('bindLicenses'),
      body: <BindXostorLicensesModal hosts={hostsWithoutLicense} />,
    })

    await Promise.all(
      map(licenseByHost, (licenseId, hostId) => {
        if (licenseId === 'none') {
          return
        }

        const license = xostorLicenseById[licenseId]
        return license.boundObjectId === undefined
          ? bindLicense(licenseId, hostId)
          : rebindLicense('xostor', licenseId, license.boundObjectId, hostId)
      })
    )
    await this.props.userData.updateLicenses()
  }

  render() {
    const licenseInfo = this.getLicenseInfo()
    if (licenseInfo === undefined) {
      return _('statusLoading')
    }
    const { alerts, supportEnabled } = licenseInfo

    return (
      <div>
        {alerts.length > 0 && <BulkIcons alerts={alerts} />}
        {supportEnabled ? (
          <Tooltip content={_('xostorProSupportEnabled')}>
            <Icon icon='menu-support' className='text-success' />
          </Tooltip>
        ) : (
          <ActionButton btnStyle='primary' className='ml-1' handler={this.bindXostorLicenses} icon='connect'>
            {_('bindLicenses')}
          </ActionButton>
        )}
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
    hosts: createGetObjectsOfType('host'),
  })),
  injectState,
  ({ state, xostorSrs, updateLicenses, hosts, xostorLicenses }) => (
    <SortedTable
      collection={xostorSrs}
      columns={COLUMNS}
      data-hosts={hosts}
      data-updateLicenses={updateLicenses}
      data-xostorLicenses={xostorLicenses}
      individualActions={INDIVIDUAL_ACTIONS}
    />
  ),
])

export default Xostor
