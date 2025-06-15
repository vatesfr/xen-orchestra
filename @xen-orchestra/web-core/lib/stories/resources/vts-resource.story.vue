<template>
  <ComponentStory :params :presets>
    <VtsResource v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsResource from '@core/components/resources/VtsResource.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import {
  faDatabase,
  faDisplay,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faRocket,
} from '@fortawesome/free-solid-svg-icons'

const { params, bindings } = useStory({
  props: {
    icon: {
      preset: faRocket,
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    label: {
      preset: 'Rockets',
      type: 'string',
      required: true,
      widget: true,
    },
    count: {
      preset: 175,
      required: true,
    },
  },
})

const presets: Record<string, () => void> = {
  VMs: () => {
    bindings.icon = faDisplay
    bindings.count = 1
    bindings.label = 'VMs'
  },
  vCPUs: () => {
    bindings.icon = faMicrochip
    bindings.count = 4
    bindings.label = 'vCPUs'
  },
  RAM: () => {
    bindings.icon = faMemory
    bindings.count = 2
    bindings.label = 'RAM'
  },
  SR: () => {
    bindings.icon = faDatabase
    bindings.count = 1
    bindings.label = 'SR'
  },
  Interfaces: () => {
    bindings.icon = faNetworkWired
    bindings.count = 2
    bindings.label = 'Interfaces'
  },
}
</script>
