import React from 'react'
import {
  Sparklines,
  SparklinesLine
} from 'react-sparklines'

import propTypes from './prop-types'
import {
  computeArraysAvg,
  computeObjectsAvg
} from './xo-stats'

const STYLE = {}

const WIDTH = 120
const HEIGHT = 20

const MINIWIDTH = 50
const MINIHEIGHT = 10

// ===================================================================

const templateError =
  <div>
    No stats.
  </div>

// ===================================================================

export const MiniCpuSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { cpus } = data.stats

  if (!cpus) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeArraysAvg(cpus)} max={100} min={0} width={MINIWIDTH} height={MINIHEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.2, stroke: '#366e98', fill: '#366e98', fillOpacity: 0 }} color='#2598d9' />
    </Sparklines>
  )
})

export const MiniPifSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { pifs } = data.stats

  if (!pifs) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeObjectsAvg(pifs)} min={0} width={MINIWIDTH} height={MINIHEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.2, stroke: '#eca649', fill: '#eca649', fillOpacity: 0.5 }} color='#ffd633' />
    </Sparklines>
  )
})

export const MiniLoadSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { load } = data.stats

  if (!load) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={load} min={0} width={MINIWIDTH} height={MINIHEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.2, stroke: '#33cc33', fill: '#33cc33', fillOpacity: 0.5 }} color='#33cc33' />
    </Sparklines>
  )
})

export const CpuSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { cpus } = data.stats

  if (!cpus) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeArraysAvg(cpus)} max={100} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.5, stroke: '#366e98', fill: '#366e98', fillOpacity: 0.5 }} color='#2598d9' />
    </Sparklines>
  )
})

export const MemorySparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { memory, memoryUsed } = data.stats

  if (!memory || !memoryUsed) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={memoryUsed} max={memory[memory.length - 1]} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.5, stroke: '#990822', fill: '#990822', fillOpacity: 0.5 }} color='#cc0066' />
    </Sparklines>
  )
})

export const XvdSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { xvds } = data.stats

  if (!xvds) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeObjectsAvg(xvds)} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.5, stroke: '#089944', fill: '#089944', fillOpacity: 0.5 }} color='#33cc33' />
    </Sparklines>
  )
})

export const VifSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { vifs } = data.stats

  if (!vifs) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeObjectsAvg(vifs)} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.5, stroke: '#eca649', fill: '#eca649', fillOpacity: 0.5 }} color='#ffd633' />
    </Sparklines>
  )
})

export const PifSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { pifs } = data.stats

  if (!pifs) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeObjectsAvg(pifs)} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.5, stroke: '#eca649', fill: '#eca649', fillOpacity: 0.5 }} color='#ffd633' />
    </Sparklines>
  )
})

export const LoadSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { load } = data.stats

  if (!load) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={load} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 0.5, stroke: '#33cc33', fill: '#33cc33', fillOpacity: 0.5 }} color='#33cc33' />
    </Sparklines>
  )
})
