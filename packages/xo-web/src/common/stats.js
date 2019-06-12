import PropTypes from 'prop-types'
import React from 'react'
import { forOwn } from 'lodash'

import _ from './intl'
import { fetchHostStats, fetchSrStats, fetchVmStats } from './xo'
import { Select } from './form'

const DEFAULT_GRANULARITY = 'seconds'

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
  value = DEFAULT_GRANULARITY,
  ...props
}) => <Select {...props} onChange={onChange} options={OPTIONS} value={value} />

SelectGranularity.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array.isRequired,
}

// ===================================================================

const FETCH_FN_BY_TYPE = {
  host: fetchHostStats,
  sr: fetchSrStats,
  vm: fetchVmStats,
}

const CUSTOMIZED_GRANULARITY = {
  lastDay: {
    granularity: 'hours',
    nValues: 24,
  },
}

const contractStats = (stats, nKeptItems) =>
  Array.isArray(stats)
    ? stats.splice(0, stats.length - nKeptItems)
    : forOwn(stats, metrics => contractStats(metrics, nKeptItems))

export const fetchStats = async (objOrId, type, granularity) => {
  const customizedGranularity = CUSTOMIZED_GRANULARITY[granularity]
  const fn = FETCH_FN_BY_TYPE[type]

  if (customizedGranularity === undefined) {
    return fn(objOrId, granularity)
  }

  const stats = await fn(objOrId, customizedGranularity.granularity)
  return contractStats(stats, customizedGranularity.nValues)
}
