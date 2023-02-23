import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { getLicenses } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import map from 'lodash/map.js'

import { renderXoItemFromId } from './render-xo-item'

const LicenseOptions = ({ license, formatDate }) => {
  const productId = license.productId.split('-')[1]
  return (
    <option value={license.id}>
      <span>
        {productId.charAt(0).toUpperCase() + productId.slice(1)} ({license.id.slice(-4)}),{' '}
        {license.expires !== undefined ? formatDate(license.expires) : '-'}
        {license.boundObjectId !== undefined && <span>, {renderXoItemFromId(license.boundObjectId)}</span>}
      </span>
    </option>
  )
}

const SelectLicense = decorate([
  injectIntl,
  provideState({
    computed: {
      licenses: async (state, { productType }) => {
        try {
          const availableLicenses = {
            bound: [],
            notBound: [],
          }
          ;(await getLicenses({ productType })).forEach(license => {
            if (license.expires === undefined || license.expires > Date.now()) {
              availableLicenses[license.boundObjectId === undefined ? 'notBound' : 'bound'].push(license)
            }
          })
          return availableLicenses
        } catch (error) {
          return { licenseError: error }
        }
      },
    },
  }),
  injectState,
  ({ state: { licenses }, intl: { formatDate }, onChange, showBoundLicenses }) =>
    licenses?.licenseError !== undefined ? (
      <span>
        <em className='text-danger'>{_('getLicensesError')}</em>
      </span>
    ) : (
      <select className='form-control' onChange={onChange}>
        {_('selectLicense', message => (
          <option key='none' value='none'>
            {message}
          </option>
        ))}

        {_('notBoundSelectLicense', i18nNotBound => (
          <optgroup label={i18nNotBound}>
            {map(licenses?.notBound, license => (
              <LicenseOptions formatDate={formatDate} key={license.id} license={license} />
            ))}
          </optgroup>
        ))}
        {showBoundLicenses &&
          _('boundSelectLicense', i18nBound => (
            <optgroup label={i18nBound}>
              {map(licenses?.bound, license => (
                <LicenseOptions formatDate={formatDate} key={license.id} license={license} />
              ))}
            </optgroup>
          ))}
      </select>
    ),
])
export default SelectLicense
