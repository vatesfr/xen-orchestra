<template>
  <ComponentStory :params="[slot().help('One or multiple `UiResource`')]" full-width-component>
    <VtsResources>
      <VtsResource :icon="faDisplay" count="1" label="VMs" />
      <VtsResource :icon="faMicrochip" count="4" label="vCPUs" />
      <VtsResource :icon="faMemory" count="2" label="RAM" />
      <VtsResource :icon="faDatabase" count="1" label="SR" />
      <VtsResource :icon="faNetworkWired" count="2" label="Interfaces" />
    </VtsResources>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
import { faDatabase, faDisplay, faMemory, faMicrochip, faNetworkWired } from '@fortawesome/free-solid-svg-icons'
</script>
