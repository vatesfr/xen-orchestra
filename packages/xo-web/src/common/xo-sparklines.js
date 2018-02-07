import React from 'react'
import { Sparklines, SparklinesLine } from 'react-sparklines'

import propTypes from './prop-types-decorator'
import { computeArraysAvg, computeObjectsAvg } from './xo-stats'

const STYLE = {}

const WIDTH = 120
const HEIGHT = 20
const STROKE_WIDTH = 0.5

// ===================================================================

const templateError = <div>No stats.</div>

// ===================================================================

export const CpuSparkLines = propTypes({
  data: propTypes.object.isRequired,
})(({ data, width = WIDTH, height = HEIGHT, strokeWidth = STROKE_WIDTH }) => {
  const { cpus } = data.stats

  if (!cpus) {
    return templateError
  }

  return (
    <Sparklines
      style={STYLE}
      data={computeArraysAvg(cpus)}
      max={100}
      min={0}
      width={width}
      height={height}
    >
      <SparklinesLine
        style={{
          strokeWidth,
          stroke: '#366e98',
          fill: '#366e98',
          fillOpacity: 0.5,
        }}
        color='#2598d9'
      />
    </Sparklines>
  )
})

export const MemorySparkLines = propTypes({
  data: propTypes.object.isRequired,
})(({ data, width = WIDTH, height = HEIGHT, strokeWidth = STROKE_WIDTH }) => {
  const { memory, memoryUsed } = data.stats

  if (!memory || !memoryUsed) {
    return templateError
  }

  return (
    <Sparklines
      style={STYLE}
      data={memoryUsed}
      max={memory[memory.length - 1]}
      min={0}
      width={width}
      height={height}
    >
      <SparklinesLine
        style={{
          strokeWidth,
          stroke: '#990822',
          fill: '#990822',
          fillOpacity: 0.5,
        }}
        color='#cc0066'
      />
    </Sparklines>
  )
})

export const XvdSparkLines = propTypes({
  data: propTypes.object.isRequired,
})(({ data, width = WIDTH, height = HEIGHT, strokeWidth = STROKE_WIDTH }) => {
  const { xvds } = data.stats

  if (!xvds) {
    return templateError
  }

  return (
    <Sparklines
      style={STYLE}
      data={computeObjectsAvg(xvds)}
      min={0}
      width={width}
      height={height}
    >
      <SparklinesLine
        style={{
          strokeWidth,
          stroke: '#089944',
          fill: '#089944',
          fillOpacity: 0.5,
        }}
        color='#33cc33'
      />
    </Sparklines>
  )
})

export const NetworkSparkLines = propTypes({
  data: propTypes.object.isRequired,
})(({ data, width = WIDTH, height = HEIGHT, strokeWidth = STROKE_WIDTH }) => {
  const { pifs, vifs: ifs = pifs } = data.stats

  return ifs === undefined ? (
    templateError
  ) : (
    <Sparklines
      style={STYLE}
      data={computeObjectsAvg(ifs)}
      min={0}
      width={width}
      height={height}
    >
      <SparklinesLine
        style={{
          strokeWidth,
          stroke: '#eca649',
          fill: '#eca649',
          fillOpacity: 0.5,
        }}
        color='#ffd633'
      />
    </Sparklines>
  )
})

export const LoadSparkLines = propTypes({
  data: propTypes.object.isRequired,
})(({ data, width = WIDTH, height = HEIGHT, strokeWidth = STROKE_WIDTH }) => {
  const { load } = data.stats

  if (!load) {
    return templateError
  }

  return (
    <Sparklines style={STYLE} data={load} min={0} width={width} height={height}>
      <SparklinesLine
        style={{
          strokeWidth,
          stroke: '#33cc33',
          fill: '#33cc33',
          fillOpacity: 0.5,
        }}
        color='#33cc33'
      />
    </Sparklines>
  )
})
