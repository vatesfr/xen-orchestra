import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { getLicenses } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { map } from 'lodash'

const SelectLicense = decorate([
  injectIntl,
  provideState({
    computed: {
      licenses: async (state, { productType }) => {
        try {
          return (await getLicenses({ productType }))?.filter(
            ({ boundObjectId, expires }) =>
              boundObjectId === undefined && (expires === undefined || expires > Date.now())
          )
        } catch (error) {
          return { licenseError: error }
        }
      },
    },
  }),
  injectState,
  ({ state: { licenses }, intl: { formatTime }, onChange }) =>
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
        {map(licenses, license =>
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
            message => (
              <option key={license.id} value={license.id}>
                {license.id.slice(-4)} {license.expires ? `(${message})` : ''}
              </option>
            )
          )
        )}
      </select>
    ),
])
export default SelectLicense
