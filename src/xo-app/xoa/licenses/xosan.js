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
              <span>
                {license.id.slice(-4)} ({license.expires === undefined ? (
                  'Unlimited time'
                ) : (
                  <Time time={license.expires} />
                )})
              </span>
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
    name: 'Name',
    itemRenderer: sr => sr.name_label,
    sortCriteria: 'name_label',
  },
  {
    name: 'License',
    itemRenderer: (sr, { availableLicenses, licensesByXosan }) => {
      const license = licensesByXosan[sr.id]
      return license !== undefined ? (
        `Bound to ${license.id.slice(-4)}`
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
    label: 'Support',
    icon: 'support',
    handler: () => window.open('http://xen-orchestra.com'),
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
        let xosan
        if ((xosan = license.boundObjectId) === undefined) {
          return
        }
        // TODO: show that something is wrong if an SR is bound to multiple licenses
        if (licensesByXosan[xosan] === undefined) {
          licensesByXosan[xosan] = license
        }
      })

      return licensesByXosan
    }
  )
  // _getXosanSrsWithLicenses = createSelector(
  //   () => this.props.xosanSrs,
  //   () => this.props.licenses,
  //   (srs, licenses) => {
  //     forEach(srs, sr => {
  //       // FIXME: Don't merge paid and trial XOSAN licenses?
  //       const license = find(get(() => [...licenses[0], ...licenses[1]]), [
  //         'boundObjectId',
  //         sr.id,
  //       ])
  //       if (license !== undefined) {
  //         sr.license = license
  //       }
  //     })
  //
  //     return srs
  //   }
  // )

  _getAvailableLicenses = createFilter(
    () => get(() => this.props.licenses[0]),
    [
      ({ boundObjectId, expires }) =>
        boundObjectId === undefined &&
        (expires === undefined || expires > Date.now()),
    ]
  )

  _getTrialSrs = createSelector(
    createSelector(
      () => get(() => this.props.licenses[1]), // xosan.trial
      trialLicenses => filter(map(trialLicenses, 'boundObjectId'))
    ),
    () => get(() => this.props.xosanSrs),
    (trialXosanIds, xosanSrs) =>
      filter(xosanSrs, ({ id }) => includes(trialXosanIds, id))
  )

  render () {
    return (
      <SortedTable
        collection={this._getTrialSrs()} // xosan.trial
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
