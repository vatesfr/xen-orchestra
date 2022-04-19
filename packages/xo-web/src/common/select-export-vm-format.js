import _ from 'intl'
import React from 'react'
import { injectState, provideState } from 'reaclette'

import decorate from './apply-decorators'
import { Select } from './form'

const OPTIONS = [
  {
    label: 'xva',
    value: 'xva',
  },
  {
    label: 'ova',
    value: 'ova',
  },
]

const SelectExportFormat = decorate([
  provideState({
    computed: {
      options: () => OPTIONS,
      selectProps: (_, props) => props,
    },
  }),
  injectState,
  ({ onChange, state, value }) => (
    <Select labelKey='label' valueKey='value' options={state.options} required simpleValue {...state.selectProps} />
  ),
])

export { SelectExportFormat as default }
