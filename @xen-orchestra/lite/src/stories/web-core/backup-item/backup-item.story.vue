<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('backup').type(`Backup`).required().preset(backup)]">
    <BackupItem v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import type { Backup } from '@core/types/backup.type'
import BackupItem from '@core/components/backup-item/BackupItem.vue'

const backup: Backup = {
  label: '20191022 - JFT - test cron',
  route: '/story',
  states: ['partial', 'success', 'failure'],
}
</script>
