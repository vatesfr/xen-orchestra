<template>
  <ComponentStory :params :presets>
    <VtsLinearChart v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import type { LinearChartData } from '@core/types/chart'
import VtsLinearChart from '@core/components/linear-chart/VtsLinearChart.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
// eslint-disable-next-line import/no-named-as-default
import humanFormat from 'human-format'

const byteFormatter = (value: number) => humanFormat.bytes(value)

let time = 0
const firstDay = () => (time = 1640995200000)
const nextDay = () => (time += 86400000)

const data: LinearChartData = [
  {
    label: 'Foo',
    data: [
      { timestamp: firstDay(), value: 50 },
      { timestamp: nextDay(), value: 20 },
      { timestamp: nextDay(), value: 90 },
      { timestamp: nextDay(), value: 30 },
      { timestamp: nextDay(), value: 70 },
    ],
  },
  {
    label: 'Bar',
    data: [
      { timestamp: firstDay(), value: 10 },
      { timestamp: nextDay(), value: 80 },
      { timestamp: nextDay(), value: 30 },
      { timestamp: nextDay(), value: 40 },
      { timestamp: nextDay(), value: 20 },
    ],
  },
]

const { params, bindings } = useStory({
  props: {
    data: {
      preset: data,
      required: true,
      help: 'See doc for typing',
    },
    'value-formatter': {
      type: '(value: number) => string',
    },
    'max-value': {
      default: 200,
    },
  },
})

const presets: Record<string, () => void> = {
  'Network bandwidth': () => {
    bindings['value-formatter'] = byteFormatter
    bindings['max-value'] = 500000000
    bindings.data = [
      {
        label: 'Download',
        data: [
          {
            timestamp: firstDay(),
            value: 4986790,
          },
          {
            timestamp: nextDay(),
            value: 354312074,
          },
          {
            timestamp: nextDay(),
            value: 379858800,
          },
          {
            timestamp: nextDay(),
            value: 319522087,
          },
          {
            timestamp: nextDay(),
            value: 344568079,
          },
          {
            timestamp: nextDay(),
            value: 46295651,
          },
          {
            timestamp: nextDay(),
            value: 344130914,
          },
        ],
      },
      {
        label: 'Upload',
        data: [
          {
            timestamp: firstDay(),
            value: 102528411,
          },
          {
            timestamp: nextDay(),
            value: 10682534,
          },
          {
            timestamp: nextDay(),
            value: 10421188,
          },
          {
            timestamp: nextDay(),
            value: 102156882,
          },
          {
            timestamp: nextDay(),
            value: 102028168,
          },
          {
            timestamp: nextDay(),
            value: 102733601,
          },
          {
            timestamp: nextDay(),
            value: 102523226,
          },
        ],
      },
    ]
  },
}
</script>
