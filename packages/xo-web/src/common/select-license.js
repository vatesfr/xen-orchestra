import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { getLicenses } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { map } from 'lodash'

import { renderXoItemFromId } from './render-xo-item'

const License = ({ license, formatTime }) =>
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
      <option value={license.id}>
        <span>
          {license.id.slice(-4)} (
          {license.boundObjectId
            ? renderXoItemFromId(license.boundObjectId)
            : license.expires !== undefined
            ? message
            : ''}
          )
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
          const _licenses = {
            bound: [],
            notBound: [],
          }
          const resp = await getLicenses({ productType })
          resp.forEach(license => {
            if (license.expires === undefined || license.expires > Date.now()) {
              _licenses[license.boundObjectId === undefined ? 'notBound' : 'bound'].push(license)
            }
          })
          return _licenses
        } catch (error) {
          return { licenseError: error }
        }
      },
    },
  }),
  injectState,
  ({ state: { licenses }, intl: { formatTime }, onChange, withBounded }) =>
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

        {_('notBounded', message => (
          <optgroup label={message}>
            {map(licenses?.notBound, license => (
              <License formatTime={formatTime} key={license.id} license={license} />
            ))}
          </optgroup>
        ))}
        {withBounded &&
          _('bounded', message => (
            <optgroup label={message}>
              {map(licenses?.bound, license => (
                <License formatTime={formatTime} key={license.id} license={license} />
              ))}
            </optgroup>
          ))}
      </select>
    ),
])
export default SelectLicense
