import ChartistGraph from 'react-chartist'
import ChartistLegend from 'chartist-plugin-legend'
import ChartistTooltip from 'chartist-plugin-tooltip'
import React from 'react'
import { injectIntl } from 'react-intl'
import {
  formatSize,
  propTypes
} from 'utils'

// Number of labels on axis X.
const N_LABELS_X = 5

const LABEL_OFFSET_X = 40
const LABEL_OFFSET_Y = 75

const makeOptions = ({ intl, nValues, endTimestamp, interval, valueTransform }) => ({
  showPoint: true,
  lineSmooth: false,
  showArea: true,
  height: 300,
  low: 0,
  axisX: {
    labelInterpolationFnc: makeLabelInterpolationFnc(intl, nValues, endTimestamp, interval),
    offset: LABEL_OFFSET_X
  },
  axisY: {
    labelInterpolationFnc: valueTransform,
    offset: LABEL_OFFSET_Y
  },
  plugins: [
    ChartistLegend(),
    ChartistTooltip({
      valueTransform: value => valueTransform(+value) // '+value' because tooltip gives a string value...
    })
  ]
})

// ===================================================================

const makeLabelInterpolationFnc = (intl, nValues, endTimestamp, interval) => {
  const labelSpace = Math.floor(nValues / N_LABELS_X)
  let format

  if (interval === 3600) {
    format = {
      minute: 'numeric',
      hour: 'numeric',
      weekday: 'short'
    }
  } else if (interval === 86400) {
    format = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }
  }

  return (value, index) =>
    index % labelSpace === 0
      ? intl.formatTime((endTimestamp - (nValues - index - 1) * interval) * 1000, format)
      : null
}

const makeObjectSeries = (data, prefix) => {
  const series = []

  for (const io in data) {
    const ioData = data[io]
    for (const letter in ioData) {
      series.push({
        name: `${prefix}${letter} (${io})`,
        data: ioData[letter]
      })
    }
  }

  return series
}

const templateError =
  <div>
    No stats.
  </div>

// ===================================================================

export const CpuLineChart = injectIntl(propTypes({
  data: propTypes.object.isRequired,
  options: propTypes.object
})(({ data, options = {}, intl }) => {
  const stats = data.stats.cpus
  const { length } = (stats && stats[0]) || {}

  if (!length) {
    return templateError
  }

  const series = []

  for (const id in stats) {
    series.push({
      name: `Cpu${id}`,
      data: stats[id]
    })
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: value => `${value}%`
        }),
        high: 100,
        ...options
      }}
    />
  )
}))

export const MemoryLineChart = injectIntl(propTypes({
  data: propTypes.object.isRequired,
  options: propTypes.object
})(({ data, options = {}, intl }) => {
  const {
    memory,
    memoryUsed
  } = data.stats

  if (!memory || !memoryUsed) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: [{
          name: 'RAM',
          data: memoryUsed
        }]
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: memoryUsed.length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize
        }),
        high: memory[memory.length - 1],
        ...options
      }}
    />
  )
}))

export const XvdLineChart = injectIntl(propTypes({
  data: propTypes.object.isRequired,
  options: propTypes.object
})(({ data, options = {}, intl }) => {
  const stats = data.stats.xvds
  const { length } = (stats && stats.r.a) || {}

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: makeObjectSeries(stats, 'Xvd')
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize
        }),
        ...options
      }}
    />
  )
}))

export const VifLineChart = injectIntl(propTypes({
  data: propTypes.object.isRequired,
  options: propTypes.object
})(({ data, options = {}, intl }) => {
  const stats = data.stats.vifs
  const { length } = (stats && stats.rx[0]) || {}

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: makeObjectSeries(stats, 'Vif')
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize
        }),
        ...options
      }}
    />
  )
}))

export const PifLineChart = injectIntl(propTypes({
  data: propTypes.object.isRequired,
  options: propTypes.object
})(({ data, options = {}, intl }) => {
  const stats = data.stats.pifs
  const { length } = (stats && stats.rx[0]) || {}

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: makeObjectSeries(stats, 'Pif')
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: formatSize
        }),
        ...options
      }}
    />
  )
}))

export const LoadLineChart = injectIntl(propTypes({
  data: propTypes.object.isRequired,
  options: propTypes.object
})(({ data, options = {}, intl }) => {
  const stats = data.stats.load
  const { length } = stats || {}

  if (!length) {
    return templateError
  }

  return (
    <ChartistGraph
      type='Line'
      data={{
        series: [{
          name: 'Load average',
          data: stats
        }]
      }}
      options={{
        ...makeOptions({
          intl,
          nValues: length,
          endTimestamp: data.endTimestamp,
          interval: data.interval,
          valueTransform: value => `${value}`
        }),
        ...options
      }}
    />
  )
}))
