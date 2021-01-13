import ChartistGraph from 'react-chartist'
import ChartistLegend from 'chartist-plugin-legend'
import ChartistTooltip from 'chartist-plugin-tooltip'
import humanFormat from 'human-format'
import PropTypes from 'prop-types'
import React from 'react'
import { injectIntl } from 'react-intl'
import { messages } from 'intl'
import { find, flatten, floor, get, map, max, round, size, sortBy, sum, values } from 'lodash'

import { computeArraysSum } from '../xo-stats'
import { formatSize, formatSpeed, formatTime, getMemoryUsedMetric } from '../utils'

import styles from './index.css'

// Number of labels on axis X.
const N_LABELS_X = 5

const LABEL_OFFSET_X = 40
const LABEL_OFFSET_Y = 85

// ===================================================================

// See xo-stats.js, data can be null.
// Return the size of the first non-null object.
const getStatsLength = stats => size(find(stats, stats => stats != null))

// ===================================================================

const makeOptions = ({ intl, nValues, endTimestamp, interval, valueTransform }) => ({
  showPoint: true,
  lineSmooth: false,
  showArea: true,
  height: 300,
  low: 0,
  axisX: {
    labelInterpolationFnc: makeLabelInterpolationFnc(intl, nValues, endTimestamp, interval),
    offset: LABEL_OFFSET_X,
  },
  axisY: {
    labelInterpolationFnc: valueTransform,
    offset: LABEL_OFFSET_Y,
  },
  plugins: [
    ChartistLegend(),
    ChartistTooltip({
      valueTransform: value => valueTransform(+value), // '+value' because tooltip gives a string value...
    }),
  ],
})

// ===================================================================

const makeLabelInterpolationFnc = (intl, nValues, endTimestamp, interval) => {
  const labelSpace = floor(nValues / N_LABELS_X)
  let format

  if (interval === 3600) {
    format = {
      minute: 'numeric',
      hour: 'numeric',
      weekday: 'short',
    }
  } else if (interval === 86400) {
    format = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }
  }

  return (value, index) =>
    index % labelSpace === 0 ? intl.formatTime((endTimestamp - (nValues - index - 1) * interval) * 1000, format) : null
}

// Supported series: xvds, vifs, pifs.
const buildSeries = ({ stats, label, addSumSeries }) => {
  let series = []

  for (const io in stats) {
    const ioData = stats[io]
    for (const letter in ioData) {
      const data = ioData[letter]

      // See xo-stats.js, data can be null.
      if (data) {
        series.push({
          name: `${label}${letter} (${io})`,
          data,
        })
      }
    }

    series = sortBy(series, 'name')

    if (addSumSeries) {
      series.push({
        name: `All ${io}`,
        data: computeArraysSum(values(ioData)),
        className: styles.dashedLine,
      })
    }
  }

  return series
}

const templateError = <div>No stats.</div>

// ===================================================================

export const CpuLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const stats = data.stats.cpus
  const length = getStatsLength(stats)

  if (!length) {
    return templateError
  }

  const series = map(stats, (data, id) => ({
    name: `Cpu${id}`,
    data,
  }))

  if (addSumSeries) {
    series.push({
      name: 'All Cpus',
      data: computeArraysSum(stats),
      className: styles.dashedLine,
    })
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series,
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: value => `${floor(value)}%`,
        }),
        high: !addSumSeries ? 100 : stats.length * 100,
        ...options,
      }}
    />
  )
})
CpuLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
}

export const PoolCpuLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const firstHostData = data[0]
  const length = getStatsLength(firstHostData.stats.cpus)

  if (!length) {
    return templateError
  }

  const series = map(data, ({ host, stats }) => ({
    name: host,
    data: computeArraysSum(stats.cpus),
  }))

  if (addSumSeries) {
    series.push({
      name: intl.formatMessage(messages.poolAllHosts),
      data: computeArraysSum(map(series, 'data')),
      className: styles.dashedLine,
    })
  }

  const nbCpusByHost = map(data, ({ stats }) => stats.cpus.length)

  return (
    <ChartistGraph
      type='Line'
      data={{
        series,
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: firstHostData.endTimestamp,
          interval: firstHostData.interval,
          valueTransform: value => `${floor(value)}%`,
        }),
        high: 100 * (addSumSeries ? sum(nbCpusByHost) : max(nbCpusByHost)),
        ...options,
      }}
    />
  )
})
PoolCpuLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

export const MemoryLineChart = injectIntl(({ data, options = {}, intl }) => {
  const { memory } = data.stats
  const memoryUsed = getMemoryUsedMetric(data.stats)

  if (!memory || !memoryUsed) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: [
          {
            name: 'RAM',
            data: memoryUsed,
          },
        ],
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: memoryUsed.length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize,
        }),
        high: memory[memory.length - 1],
        ...options,
      }}
    />
  )
})

MemoryLineChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
}

export const PoolMemoryLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const firstHostData = data[0]
  const { memory } = firstHostData.stats
  const memoryUsed = getMemoryUsedMetric(firstHostData.stats)

  if (!memory || !memoryUsed) {
    return templateError
  }

  const series = map(data, ({ host, stats }) => ({
    name: host,
    data: getMemoryUsedMetric(stats),
  }))

  if (addSumSeries) {
    series.push({
      name: intl.formatMessage(messages.poolAllHosts),
      data: computeArraysSum(map(data, ({ stats }) => getMemoryUsedMetric(stats))),
      className: styles.dashedLine,
    })
  }

  const currentMemoryByHost = map(data, ({ stats }) => stats.memory[stats.memory.length - 1])

  return (
    <ChartistGraph
      type='Line'
      data={{
        series,
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: memoryUsed.length,
          endTimestamp: firstHostData.endTimestamp,
          interval: firstHostData.interval,
          valueTransform: formatSize,
        }),
        high: addSumSeries ? sum(currentMemoryByHost) : max(currentMemoryByHost),
        ...options,
      }}
    />
  )
})

PoolMemoryLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

export const XvdLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const stats = data.stats.xvds
  const length = stats && getStatsLength(stats.r)

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSeries({ addSumSeries, stats, label: 'Xvd' }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize,
        }),
        ...options,
      }}
    />
  )
})

XvdLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
}

export const VifLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const stats = data.stats.vifs
  const length = stats && getStatsLength(stats.rx)

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSeries({ addSumSeries, stats, label: 'Vif' }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize,
        }),
        ...options,
      }}
    />
  )
})

VifLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
}

export const PifLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const stats = data.stats.pifs
  const length = stats && getStatsLength(stats.rx)

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSeries({ addSumSeries, stats, label: 'eth' }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize,
        }),
        ...options,
      }}
    />
  )
})

PifLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

const ios = ['rx', 'tx']
export const PoolPifLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const firstHostData = data[0]
  const length = firstHostData.stats && getStatsLength(firstHostData.stats.pifs.rx)

  if (!length) {
    return templateError
  }

  const series = addSumSeries
    ? map(ios, io => ({
        name: `${intl.formatMessage(messages.poolAllHosts)} (${io})`,
        data: computeArraysSum(map(data, ({ stats }) => computeArraysSum(stats.pifs[io]))),
      }))
    : flatten(
        map(data, ({ stats, host }) =>
          map(ios, io => ({
            name: `${host} (${io})`,
            data: computeArraysSum(stats.pifs[io]),
          }))
        )
      )

  return (
    <ChartistGraph
      type='Line'
      data={{
        series,
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: firstHostData.endTimestamp,
          interval: firstHostData.interval,
          valueTransform: formatSize,
        }),
        ...options,
      }}
    />
  )
})

PoolPifLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

export const LoadLineChart = injectIntl(({ data, options = {}, intl }) => {
  const stats = data.stats.load
  const { length } = stats || {}

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: [
          {
            name: 'Load average',
            data: stats,
          },
        ],
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: value => `${value.toPrecision(3)}`,
        }),
        ...options,
      }}
    />
  )
})

LoadLineChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
}

export const PoolLoadLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const firstHostData = data[0]
  const length = firstHostData.stats && firstHostData.stats.load.length

  if (!length) {
    return templateError
  }

  const series = map(data, ({ host, stats }) => ({
    name: host,
    data: stats.load,
  }))

  if (addSumSeries) {
    series.push({
      name: intl.formatMessage(messages.poolAllHosts),
      data: computeArraysSum(map(data, 'stats.load')),
      className: styles.dashedLine,
    })
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series,
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: firstHostData.endTimestamp,
          interval: firstHostData.interval,
          valueTransform: value => `${value.toPrecision(3)}`,
        }),
        ...options,
      }}
    />
  )
})

PoolLoadLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

const buildSrSeries = ({ stats, label, addSumSeries }) => {
  const series = sortBy(
    map(stats, (data, key) => ({
      name: `${label} (${key})`,
      data,
    })),
    'name'
  )

  if (addSumSeries) {
    series.push({
      name: `All ${label}`,
      data: computeArraysSum(values(stats)),
      className: styles.dashedLine,
    })
  }

  return series
}

export const IopsLineChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const {
    endTimestamp,
    interval,
    stats: { iops },
  } = data

  const { length } = get(iops, 'r')

  if (length === 0) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSrSeries({ stats: iops, label: 'Iops', addSumSeries }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp,
          interval,
          valueTransform: value =>
            humanFormat(value, {
              decimals: 3,
              unit: 'IOPS',
            }),
        }),
        ...options,
      }}
    />
  )
})

IopsLineChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

export const IoThroughputChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const {
    endTimestamp,
    interval,
    stats: { ioThroughput },
  } = data

  const { length } = get(ioThroughput, 'r') || []

  if (length === 0) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSrSeries({
          stats: ioThroughput,
          label: 'IO throughput',
          addSumSeries,
        }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp,
          interval,
          valueTransform: value => formatSpeed(value, 1e3),
        }),
        ...options,
      }}
    />
  )
})

IoThroughputChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

export const LatencyChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const {
    endTimestamp,
    interval,
    stats: { latency },
  } = data

  const { length } = get(latency, 'r') || []

  if (length === 0) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSrSeries({
          stats: latency,
          label: 'Latency',
          addSumSeries,
        }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp,
          interval,
          valueTransform: value => formatTime(value),
        }),
        ...options,
      }}
    />
  )
})

LatencyChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}

export const IowaitChart = injectIntl(({ addSumSeries, data, options = {}, intl }) => {
  const {
    endTimestamp,
    interval,
    stats: { iowait },
  } = data

  const { length } = iowait[Object.keys(iowait)[0]] || []

  if (length === 0) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: buildSrSeries({
          stats: iowait,
          label: 'IOwait',
          addSumSeries,
        }),
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp,
          interval,
          valueTransform: value => `${round(value, 3)}%`,
        }),
        ...options,
      }}
    />
  )
})

IowaitChart.propTypes = {
  addSumSeries: PropTypes.bool,
  data: PropTypes.array.isRequired,
  options: PropTypes.object,
}
