import _ from 'intl'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { confirm } from 'modal'
import { createGetObject } from 'selectors'
import { injectState, provideState } from 'reaclette'
import { satisfies as versionSatisfies } from 'semver'

import { connectStore, noop } from './utils'

// XAPI values should be lowercased
const VM_BOOT_FIRMWARES = ['bios', 'uefi']

const SelectBootFirmware = decorate([
  connectStore({
    host: createGetObject((_, props) => props.host),
  }),
  provideState({
    effects: {
      handleBootFirmwareChange(__, { target: { value } }) {
        if (value !== '' && this.props.host !== undefined && versionSatisfies(this.props.host.version, '~8.0')) {
          // Guest UEFI boot is provided in CH/XCP-ng 8.0 as an experimental feature.
          // https://docs.citrix.com/en-us/citrix-hypervisor/8-0/downloads/citrix-hypervisor-8.0.pdf#page=10
          confirm({
            title: _('vmBootFirmware'),
            body: _('vmBootFirmwareWarningMessage'),
          }).then(() => this.props.onChange(value), noop)
        } else {
          this.props.onChange(value)
        }
      },
    },
  }),
  injectState,
  ({ effects, value }) => (
    <select className='form-control' onChange={effects.handleBootFirmwareChange} value={value}>
      <option value=''>{_('vmDefaultBootFirmwareLabel')}</option>
      {VM_BOOT_FIRMWARES.map(val => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>
  ),
])

SelectBootFirmware.propTypes = {
  host: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
}

export default SelectBootFirmware
