<template>
  <ComponentStory :params>
    <PowerStateIcon class="icon" v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import PowerStateIcon from '@/components/PowerStateIcon.vue'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    state: {
      preset: VM_POWER_STATE.RUNNING,
      type: 'VM_POWER_STATE',
      required: true,
      widget: choice(...Object.values(VM_POWER_STATE)),
    },
  },
})
</script>

<style lang="postcss" scoped>
.icon {
  font-size: 10rem;
}
</style>
