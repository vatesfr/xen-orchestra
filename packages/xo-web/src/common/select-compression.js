import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import omit from 'lodash/omit.js'

import decorate from './apply-decorators'
import { Select } from './form'

const OPTIONS = [
  {
    label: _('stateDisabled'),
    value: '',
  },
  {
    label: _('chooseCompressionGzipOption'),
    value: 'native',
  },
]

const OPTIONS_WITH_ZSTD = [
  ...OPTIONS,
  {
    label: _('chooseCompressionZstdOption'),
    value: 'zstd',
  },
]

const SELECT_COMPRESSION_PROP_TYPES = {
  showZstd: PropTypes.bool,
}

const SelectCompression = decorate([
  provideState({
    computed: {
      options: (_, { showZstd }) => (showZstd ? OPTIONS_WITH_ZSTD : OPTIONS),
      selectProps: (_, props) => omit(props, Object.keys(SELECT_COMPRESSION_PROP_TYPES)),
    },
  }),
  injectState,
  ({ onChange, state, value }) => (
    <Select labelKey='label' options={state.options} required simpleValue {...state.selectProps} />
  ),
])

SelectCompression.defaultProps = { showZstd: true }
SelectCompression.propTypes = SELECT_COMPRESSION_PROP_TYPES
export { SelectCompression as default }
