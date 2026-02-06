<template>
  <ComponentStory :params="[slot().help('One or multiple `UiResource`')]" full-width-component>
    <VtsResources>
      <VtsResource icon="object:vm" count="1" label="VMs" />
      <VtsResource icon="fa:microchip" count="4" label="vCPUs" />
      <VtsResource icon="fa:memory" count="2" label="RAM" />
      <VtsResource icon="object:sr" count="1" label="SR" />
      <VtsResource icon="object:network" count="2" label="Interfaces" />
    </VtsResources>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
</script>
