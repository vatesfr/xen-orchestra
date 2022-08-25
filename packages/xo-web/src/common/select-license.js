import _ from 'intl'

import decorate from 'apply-decorators'
import ActionButton from 'action-button'
import React from 'react'
import { map } from 'lodash'
import { getLicenses } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { linkState } from 'reaclette-utils'

const SelectLicense = decorate([
  injectIntl,
  provideState({
    initialState: () => ({
      license: 'none',
    }),
    effects: {
      linkState,
    },
    computed: {
      licenses: async (state, { productType }) => {
        try {
          return await getLicenses({ productType })
        } catch (error) {
          return { licenseError: error }
        }
      },
    },
  }),
  injectState,
  ({ state: { license, licenses }, effects, intl: { formatTime }, onChange }) =>
    licenses.licenseError !== undefined ? (
      <span>
        <em className='text-danger'>{_('getLicensesError')}</em>
      </span>
    ) : (
      <form className='form-inline'>
        <select className='form-control' name='license' onChange={effects.linkState}>
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
        <ActionButton
          btnStyle='primary'
          className='ml-1'
          disabled={license === 'none'}
          handler={onChange}
          handlerParam={license}
          icon='connect'
        >
          {_('bindLicense')}
        </ActionButton>
      </form>
    ),
])
export default SelectLicense
