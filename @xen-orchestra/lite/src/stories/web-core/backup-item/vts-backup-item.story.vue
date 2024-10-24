<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('backup').type(`Backup`).required().preset(backup)]">
    <VtsBackupItem v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsBackupItem, { type Backup } from '@core/components/backup-item/VtsBackupItem.vue'

const backup: Backup = {
  label: '20191022 - JFT - test cron',
  route: '/story',
  states: ['partial', 'success', 'failure'],
}
</script>
