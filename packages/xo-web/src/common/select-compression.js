import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import Select from 'form/select'

const OPTIONS = [
  {
    label: _('stateDisabled'),
    value: '',
  },
  {
    label: _('chooseCompressionGzipOption'),
    value: 'native',
  },
  {
    label: _('chooseCompressionZstdOption'),
    value: 'zstd',
  },
]

const SelectCompression = ({ onChange, value, ...props }) => (
  <Select
    labelKey='label'
    onChange={onChange}
    options={OPTIONS}
    required
    simpleValue
    value={value}
    {...props}
  />
)

SelectCompression.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

export { SelectCompression as default }
