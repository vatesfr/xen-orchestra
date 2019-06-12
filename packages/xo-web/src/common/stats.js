import PropTypes from 'prop-types'
import React from 'react'

import _ from './intl'
import { Select } from './form'

const GRANULARITY_DEFAULT_VALUE = 'seconds'

const OPTIONS = [
  {
    label: _('statLastTenMinutes'),
    value: 'seconds',
  },
  {
    label: _('statLastTwoHours'),
    value: 'minutes',
  },
  {
    label: _('statLastDay'),
    value: 'lastDay',
  },
  {
    label: _('statLastWeek'),
    value: 'hours',
  },
  {
    label: _('statLastYear'),
    value: 'days',
  },
]

export const SelectGranularity = ({
  onChange,
  value = GRANULARITY_DEFAULT_VALUE,
  ...props
}) => <Select {...props} onChange={onChange} options={OPTIONS} value={value} />

SelectGranularity.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array.isRequired,
}
