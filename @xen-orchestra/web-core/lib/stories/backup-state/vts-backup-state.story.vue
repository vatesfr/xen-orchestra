<template>
  <ComponentStory :params>
    <VtsBackupState v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsBackupState, { type BackupState } from '@core/components/backup-state/VtsBackupState.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    state: {
      preset: ref<BackupState>('success'),
      type: 'BackupState',
      required: true,
      widget: choice<BackupState>('success', 'interrupted', 'skipped', 'failure'),
    },
  },
})
</script>
