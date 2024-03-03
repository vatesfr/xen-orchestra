<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset(faRocket),
      prop('label').required().str().widget().preset('Rockets'),
      prop('count').required().type('string | number').widget(text()).preset('175'),
    ]"
    :presets
  >
    <UiResource v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import UiResource from '@/components/ui/resources/UiResource.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import {
  faDatabase,
  faDisplay,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faRocket,
} from '@fortawesome/free-solid-svg-icons'

const presets = {
  VMs: {
    props: {
      icon: faDisplay,
      count: 1,
      label: 'VMs',
    },
  },
  vCPUs: {
    props: {
      icon: faMicrochip,
      count: 4,
      label: 'vCPUs',
    },
  },
  RAM: {
    props: {
      icon: faMemory,
      count: 2,
      label: 'RAM',
    },
  },
  SR: {
    props: {
      icon: faDatabase,
      count: 1,
      label: 'SR',
    },
  },
  Interfaces: {
    props: {
      icon: faNetworkWired,
      count: 2,
      label: 'Interfaces',
    },
  },
}
</script>
