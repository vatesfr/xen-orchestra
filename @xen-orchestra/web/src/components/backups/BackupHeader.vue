<template>
  <UiHeadBar icon="object:backup-job">
    {{ backupJob.name }}
    <template #actions>
      <UiLink size="medium" href="/#/backup/new">{{ t('configure-in-xo-5') }}</UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/runs`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('runs') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/configuration`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('configuration') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/backup/${backupJob.id}/backed-up-vms`" custom>
      <TabItem :active="isActive" :href tag="a" :disabled="backupJob.type !== 'backup'">
        {{ t('backed-up-vms') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ t('backup-targets') }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ backupJob: XoBackupJob }>()

const { t } = useI18n()
</script>
