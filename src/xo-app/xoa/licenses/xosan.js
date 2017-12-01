import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions, connectStore, Time } from 'utils'
import { createSelector, createGetObjectsOfType, createFilter } from 'selectors'
import { subscribeLicenses, unlockXosan } from 'xo'
import { get } from 'xo-defined'
import { filter, forEach, includes, map } from 'lodash'

class SelectLicense extends Component {
  render () {
    return (
      <form className='form-inline'>
        <select onChange={this.linkState('license')} className='form-control'>
          <option key='none' disabled selected>
            Select a license
          </option>
          {map(this.props.licenses, license => (
            <option key={license.id} value={license.id}>
              {license.id.slice(-4)}
              {license.expires !== undefined && (
                <span>
                  {' '}
                  (<Time timestamp={license.expires} />)
                </span>
              )}
            </option>
          ))}
        </select>
        <ActionButton
          btnStyle='primary'
          className='ml-1'
          disabled={this.state.license === undefined}
          handler={this.props.onChange}
          handlerParam={get(() => this.state.license)}
          icon='connect'
        >
          Bind license
        </ActionButton>
      </form>
    )
  }
}

const XOSAN_COLUMNS = [
  {
    name: _('xosanName'),
    itemRenderer: sr => sr.name_label,
    sortCriteria: 'name_label',
  },
  {
    name: _('xosanLicense'),
    itemRenderer: (sr, { availableLicenses, licensesByXosan }) => {
      const license = licensesByXosan[sr.id]
      return license !== undefined ? (
        license.id.slice(-4)
      ) : (
        <SelectLicense
          licenses={availableLicenses}
          onChange={licenseId => unlockXosan(licenseId, sr.id)}
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

@connectStore({
  xosanSrs: createGetObjectsOfType('SR').filter([
    ({ SR_type }) => SR_type === 'xosan', // eslint-disable-line camelcase
  ]),
})
@addSubscriptions({
  licenses: cb => subscribeLicenses(['xosan', 'xosan.trial'], cb),
})
export default class Xosan extends Component {
  _getLicensesByXosan = createSelector(
    () => get(() => this.props.licenses[0]), // xosan
    licenses => {
      const licensesByXosan = {}
      forEach(licenses, license => {
        let xosanId
        if ((xosanId = license.boundObjectId) === undefined) {
          return
        }
        // TODO: show that something is wrong if an SR is bound to multiple licenses
        if (licensesByXosan[xosanId] === undefined) {
          licensesByXosan[xosanId] = license
        }
      })

      return licensesByXosan
    }
  )

  _getAvailableLicenses = createFilter(
    () => get(() => this.props.licenses[0]),
    [
      ({ boundObjectId, expires }) =>
        boundObjectId === undefined &&
        (expires === undefined || expires > Date.now()),
    ]
  )

  _getKnownXosans = createSelector(
    createSelector(
      () => get(() => this.props.licenses[0]) || [], // xosan
      () => get(() => this.props.licenses[1]) || [], // xosan.trial
      (licenses, trialLicenses) =>
        filter(map(licenses.concat(trialLicenses), 'boundObjectId'))
    ),
    () => get(() => this.props.xosanSrs),
    (knownXosanIds, xosanSrs) =>
      filter(xosanSrs, ({ id }) => includes(knownXosanIds, id))
  )

  render () {
    return (
      <SortedTable
        collection={this._getKnownXosans()}
        columns={XOSAN_COLUMNS}
        individualActions={XOSAN_INDIVIDUAL_ACTIONS}
        userData={{
          availableLicenses: this._getAvailableLicenses(),
          licensesByXosan: this._getLicensesByXosan(),
          xosanSrs: this.props.xosanSrs,
        }}
      />
    )
  }
}
