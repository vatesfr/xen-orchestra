import map from 'lodash/map'
import React from 'react'
import {
  Sparklines,
  SparklinesLine,
  SparklinesSpots
} from 'react-sparklines'
import { propTypes } from 'utils'

const STYLE = {}

const WIDTH = 120
const HEIGHT = 40

// ===================================================================

function computeArraysAvg (arrays) {
  if (!arrays || !arrays.length || !arrays[0].length) {
    return []
  }

  const n = arrays[0].length
  const m = arrays.length

  const result = new Array(n)

  for (let i = 0; i < n; i++) {
    result[i] = 0

    for (let j = 0; j < m; j++) {
      result[i] += arrays[j][i]
    }

    result[i] /= m
  }

  return result
}

function computeObjectsAvg (objects) {
  return computeArraysAvg(
    map(objects, (object) =>
      computeArraysAvg(map(object, (arr) => arr))
    )
  )
}

const templateError =
  <div>
    No stats.
  </div>

// ===================================================================

export const CpuSparkLines = propTypes({
  data: propTypes.object.isRequired
})(({ data }) => {
  const { cpus } = data.stats

  if (!cpus) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={computeArraysAvg(cpus)} max={100} min={0} width={WIDTH} height={HEIGHT}>
      <SparklinesLine style={{ strokeWidth: 1, stroke: '#2598d9', fill: '#2598d9', fillOpacity: 0.5 }} color='#2598d9'/>
      <SparklinesSpots />
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
      <SparklinesLine style={{ strokeWidth: 1, stroke: '#cc0066', fill: '#cc0066', fillOpacity: 0.5 }} color='#cc0066' />
      <SparklinesSpots />
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
      <SparklinesLine style={{ strokeWidth: 1, stroke: '#33cc33', fill: '#33cc33', fillOpacity: 0.5 }} color='#33cc33'/>
      <SparklinesSpots />
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
      <SparklinesLine style={{ strokeWidth: 1, stroke: '#ffd633', fill: '#ffd633', fillOpacity: 0.5 }} color='#ffd633' />
      <SparklinesSpots />
    </Sparklines>
  )
})
