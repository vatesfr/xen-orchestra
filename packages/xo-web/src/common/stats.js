import PropTypes from 'prop-types'
import React from 'react'
import forOwn from 'lodash/forOwn.js'

import _ from './intl'
import { fetchHostStats, fetchSrStats, fetchVmStats } from './xo'
import { Select } from './form'

export const DEFAULT_GRANULARITY = {
  granularity: 'seconds',
  label: _('statLastTenMinutes'),
  value: 'lastTenMinutes',
}

const OPTIONS = [
  DEFAULT_GRANULARITY,
  {
    granularity: 'minutes',
    label: _('statLastTwoHours'),
    value: 'lastTwoHours',
  },
  {
    granularity: 'hours',
    keep: 24,
    label: _('statLastDay'),
    value: 'lastDay',
  },
  {
    granularity: 'hours',
    label: _('statLastWeek'),
    value: 'lastWeek',
  },
  {
    granularity: 'days',
    label: _('statLastYear'),
    value: 'lastYear',
  },
]

export const SelectGranularity = ({ onChange, value, ...props }) => (
  <Select {...props} onChange={onChange} options={OPTIONS} value={value} />
)

SelectGranularity.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired,
}

// ===================================================================

const FETCH_FN_BY_TYPE = {
  host: fetchHostStats,
  sr: fetchSrStats,
  vm: fetchVmStats,
}

const keepNLastItems = (stats, n) =>
  Array.isArray(stats) ? stats.splice(0, stats.length - n) : forOwn(stats, metrics => keepNLastItems(metrics, n))

export const fetchStats = async (objOrId, type, { granularity, keep }) => {
  const stats = await FETCH_FN_BY_TYPE[type](objOrId, granularity)
  if (keep !== undefined) {
    keepNLastItems(stats, keep)
  }
  return stats
}
