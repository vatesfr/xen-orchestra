<template>
  <VtsStateHero v-if="!areBackupLogsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!backupLog" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <BackupLogHeader v-if="uiStore.hasUi" :backup-log />
    <component :is="Component" :backup-log />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupLogHeader from '@/modules/backup-log/components/header/BackupLogHeader.vue'
import {
  type FrontXoBackupLog,
  useXoBackupLogCollection,
} from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/admin/backup-log/[id]', 'general')

const route = useRoute<'/admin/backup-log/[id]'>()

const uiStore = useUiStore()

const { t } = useI18n()

const { areBackupLogsReady, useGetBackupLogById } = useXoBackupLogCollection()

const backupLog = useGetBackupLogById(() => route.params.id as FrontXoBackupLog['id'])
</script>
