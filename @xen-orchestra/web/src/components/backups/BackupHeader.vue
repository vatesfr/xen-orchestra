<template>
  <UiHeadBar icon="object:backup-job">
    {{ backupJob.name }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/runs`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('runs') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('configuration') }}</TabItem>
    <TabItem disabled>{{ t('backed-up-vms') }}</TabItem>
    <TabItem disabled>{{ t('backup-targets') }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ backupJob: XoBackupJob }>()

const { t } = useI18n()
</script>
