<template>
  <ComponentStory :params="[slot().help('One or multiple `UiResource`')]" full-width-component>
    <UiResources>
      <UiResource :icon="faDisplay" count="1" label="VMs" />
      <UiResource :icon="faMicrochip" count="4" label="vCPUs" />
      <UiResource :icon="faMemory" count="2" label="RAM" />
      <UiResource :icon="faDatabase" count="1" label="SR" />
      <UiResource :icon="faNetworkWired" count="2" label="Interfaces" />
    </UiResources>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import UiResource from '@/components/ui/resources/UiResource.vue'
import UiResources from '@/components/ui/resources/UiResources.vue'
import { slot } from '@/libs/story/story-param'
import { faDatabase, faDisplay, faMemory, faMicrochip, faNetworkWired } from '@fortawesome/free-solid-svg-icons'
</script>
