<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('state')
        .type(`BackupState`)
        .required()
        .enum('success', 'skipped', 'interrupted', 'failure')
        .preset('success')
        .widget(),
    ]"
  >
    <VtsBackupState v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsBackupState from '@core/components/backup-state/VtsBackupState.vue'
</script>
