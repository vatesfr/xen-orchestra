<template>
  <ComponentStory
    :params="[slot().help('The parts, separated by an interpunct; a part hidden by v-if leaves no stray separator')]"
  >
    <VtsInlineParts>
      <span>12 hosts</span>
      <span>48 VMs</span>
      <span>3 SRs</span>
    </VtsInlineParts>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param.ts'
import VtsInlineParts from '@core/components/inline-parts/VtsInlineParts.vue'
</script>
