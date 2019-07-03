import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { omit } from 'lodash'

import decorate from '../apply-decorators'
import Select from '../form/select'

const COMMON_OPTIONS = [
  {
    label: _('stateDisabled'),
    value: '',
  },
  {
    label: _('chooseCompressionGzipOption'),
    value: 'native',
  },
]

const ZSTD_OPTION = {
  label: _('chooseCompressionZstdOption'),
  value: 'zstd',
}

const SELECT_COMPRESSION_PROP_TYPES = {
  showZstd: PropTypes.bool,
}

const SelectCompression = decorate([
  provideState({
    computed: {
      options: (_, { showZstd }) =>
        showZstd ? [...COMMON_OPTIONS, ZSTD_OPTION] : COMMON_OPTIONS,
      selectProps: (_, props) =>
        omit(props, Object.keys(SELECT_COMPRESSION_PROP_TYPES)),
    },
  }),
  injectState,
  ({ onChange, state, value }) => (
    <Select
      labelKey='label'
      options={state.options}
      required
      simpleValue
      {...state.selectProps}
    />
  ),
])

SelectCompression.defaultProps = { showZstd: true }
SelectCompression.propTypes = SELECT_COMPRESSION_PROP_TYPES
export { SelectCompression as default }
