<template>
  <UiPanelCard class="backup-log-task-json-card">
    <UiPanelCardTitle size="medium" :label="t('task')" />
    <UiLogEntryViewer :content="task" :label="t('json')" size="small" accent="info" />
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  task: BackupLogTask
}>()

const { t } = useI18n()
</script>
