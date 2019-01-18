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
    label: _('choseCompressionGzipOption'),
    value: 'native',
  },
  {
    label: _('choseCompressionZstdOption'),
    value: 'zstd',
  },
]

const Compression = ({ onChange, value, ...props }) => (
  <Select
    labelKey='label'
    onChange={onChange}
    options={OPTIONS}
    required
    simpleValue
    value={value}
    valueKey='value'
    {...props}
  />
)

Compression.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

export { Compression as default }
