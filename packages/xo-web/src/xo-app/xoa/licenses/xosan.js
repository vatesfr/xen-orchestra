import _ from 'intl'
import Component from 'base-component'
import Link from 'link'
import React from 'react'
import renderXoItem, { Pool } from 'render-xo-item'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import { connectStore } from 'utils'
import { createSelector, createGetObjectsOfType, createFilter } from 'selectors'
import { filter, forEach, includes, map } from 'lodash'
import { unlockXosan } from 'xo'

const XOSAN_COLUMNS = [
  {
    name: _('xosanName'),
    itemRenderer: sr => <Link to={`srs/${sr.id}`}>{renderXoItem(sr)}</Link>,
    sortCriteria: 'name_label',
  },
  {
    name: _('xosanPool'),
    itemRenderer: sr => <Pool id={sr.$pool} link />,
  },
  {
    name: _('license'),
    itemRenderer: (sr, { availableLicenses, licensesByXosan, updateLicenses }) => {
      const license = licensesByXosan[sr.id]

      if (license === null) {
        return (
          <span className='text-danger'>
            {_('xosanMultipleLicenses')} <a href='https://xen-orchestra.com/'>{_('contactUs')}</a>
          </span>
        )
      }

      return license !== undefined && license.productId === 'xosan' ? (
        license.id.slice(-4)
      ) : (
        <SelectLicense
          licenses={availableLicenses}
          onChange={licenseId => unlockXosan(licenseId, sr.id).then(updateLicenses)}
          productType='xosan'
        />
      )
    },
  },
]

const XOSAN_INDIVIDUAL_ACTIONS = [
  {
    label: _('productSupport'),
    icon: 'support',
    handler: () => window.open('https://xen-orchestra.com'),
  },
]

@connectStore(() => ({
  xosanSrs: createGetObjectsOfType('SR').filter([
    ({ SR_type }) => SR_type === 'xosan', // eslint-disable-line camelcase
  ]),
}))
export default class Xosan extends Component {
  _getLicensesByXosan = createSelector(
    () => this.props.xosanLicenses,
    licenses => {
      const licensesByXosan = {}
      forEach(licenses, license => {
        let xosanId
        if ((xosanId = license.boundObjectId) === undefined) {
          return
        }
        licensesByXosan[xosanId] =
          licensesByXosan[xosanId] !== undefined
            ? null // XOSAN bound to multiple licenses!
            : license
      })

      return licensesByXosan
    }
  )

  _getAvailableLicenses = createFilter(
    () => this.props.xosanLicenses,
    [({ boundObjectId, expires }) => boundObjectId === undefined && (expires === undefined || expires > Date.now())]
  )

  _getKnownXosans = createSelector(
    createSelector(
      () => this.props.xosanLicenses,
      (licenses = []) => filter(map(licenses, 'boundObjectId'))
    ),
    () => this.props.xosanSrs,
    (knownXosanIds, xosanSrs) => filter(xosanSrs, ({ id }) => includes(knownXosanIds, id))
  )

  render() {
    return (
      <SortedTable
        collection={this._getKnownXosans()}
        columns={XOSAN_COLUMNS}
        individualActions={XOSAN_INDIVIDUAL_ACTIONS}
        stateUrlParam='s_xosan'
        userData={{
          availableLicenses: this._getAvailableLicenses(),
          licensesByXosan: this._getLicensesByXosan(),
          xosanSrs: this.props.xosanSrs,
          updateLicenses: this.props.updateLicenses,
        }}
      />
    )
  }
}
