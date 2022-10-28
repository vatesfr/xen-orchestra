import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { getLicenses } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { map } from 'lodash'

import { renderXoItemFromId } from './render-xo-item'

const LicenseOptions = ({ license, formatTime }) =>
  _(
    'expiresOn',
    {
      date:
        license.expires !== undefined
          ? formatTime(license.expires, {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
            })
          : '',
    },
    expirationDate => (
      <option value={license.id}>
        <span>
          {license.id.slice(-4)} {expirationDate} {license.boundObjectId && renderXoItemFromId(license.boundObjectId)}
        </span>
      </option>
    )
  )

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
  ({ state: { licenses }, intl: { formatTime }, onChange, showBoundLicenses }) =>
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

        {_('notBound', i18nNotBound => (
          <optgroup label={i18nNotBound}>
            {map(licenses?.notBound, license => (
              <LicenseOptions formatTime={formatTime} key={license.id} license={license} />
            ))}
          </optgroup>
        ))}
        {showBoundLicenses &&
          _('bound', i18nBound => (
            <optgroup label={i18nBound}>
              {map(licenses?.bound, license => (
                <LicenseOptions formatTime={formatTime} key={license.id} license={license} />
              ))}
            </optgroup>
          ))}
      </select>
    ),
])
export default SelectLicense
