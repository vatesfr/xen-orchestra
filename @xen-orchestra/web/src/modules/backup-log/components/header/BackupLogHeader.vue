<template>
  <BackupLogHeaderBreadcrumb :log-name />
  <UiHeadBar icon="object:backup-run">
    {{ logName }}
    <template #actions>
      <UiLink size="medium" :href="xo5LogsHref">
        {{ t('configure-in-xo-5') }}
      </UiLink>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/admin/backup-log/[id]/general', params: { id: backupLog.id } }"
      custom
    >
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/admin/backup-log/[id]/run', params: { id: backupLog.id } }"
      custom
    >
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('run') }}
      </UiTabItem>
    </RouterLink>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/admin/backup-log/[id]/backed-up-vms', params: { id: backupLog.id } }"
      custom
    >
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('backed-up-vms') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import BackupLogHeaderBreadcrumb from '@/modules/backup-log/components/header/BackupLogHeaderBreadcrumb.vue'
import { useXoBackupLogsUtils } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{ backupLog: FrontXoBackupLog }>()

const { t } = useI18n()

const { getBackupLogDate } = useXoBackupLogsUtils()

const logName = computed(() => t('log-name', { date: getBackupLogDate(backupLog.start) }))

const { buildXo5Route } = useXoRoutes()

const xo5LogsHref = computed(() => buildXo5Route('/backup/overview'))
</script>
