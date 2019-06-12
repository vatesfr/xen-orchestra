import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { confirm } from 'modal'
import { injectState, provideState } from 'reaclette'
import { noop } from 'utils'

// https://docs.citrix.com/en-us/citrix-hypervisor/whats-new/experimental.html
// XAPI values should be lowercased
const VM_BOOT_FIRMWARES = ['bios', 'uefi']

const withState = provideState({
  effects: {
    handleBootFirmwareChange(
      __,
      {
        target: { value },
      }
    ) {
      if (value !== '') {
        // TODO: Confirm should be removed once the feature is stabilized
        confirm({
          title: _('vmBootFirmware'),
          body: _('vmBootFirmwareWarningMessage'),
        }).then(() => this.props.onChange(value), noop)
      } else {
        this.props.onChange(value)
      }
    },
  },
})

const SelectBootFirmware = ({ effects, value }) => (
  <select
    className='form-control'
    onChange={effects.handleBootFirmwareChange}
    value={value}
  >
    <option value=''>{_('vmDefaultBootFirmwareLabel')}</option>
    {VM_BOOT_FIRMWARES.map(val => (
      <option key={val} value={val}>
        {val}
      </option>
    ))}
  </select>
)

SelectBootFirmware.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
}

export default withState(injectState(SelectBootFirmware))
