<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('state')
        .enum(...Object.values(VM_POWER_STATE))
        .required()
        .preset(VM_POWER_STATE.RUNNING)
        .widget(),
    ]"
  >
    <PowerStateIcon class="icon" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import PowerStateIcon from '@/components/PowerStateIcon.vue'
import { prop } from '@/libs/story/story-param'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
</script>

<style lang="postcss" scoped>
.icon {
  font-size: 10rem;
}
</style>
