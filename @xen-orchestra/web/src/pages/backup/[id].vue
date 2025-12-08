<template>
  <VtsStateHero v-if="!areBackupJobsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!backupJob" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <BackupHeader v-if="uiStore.hasUi" :backup-job />
    <component :is="Component" :backup-job />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupHeader from '@/components/backups/BackupHeader.vue'
import { useXoBackupJobCollection } from '@/remote-resources/use-xo-backup-job-collection'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import type { AnyXoBackupJob } from '@vates/types'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

useDefaultTab('/backup/[id]', 'runs')

const route = useRoute<'/backup/[id]'>()

const { t } = useI18n()

const { areBackupJobsReady, useGetBackupJobById } = useXoBackupJobCollection()
const uiStore = useUiStore()

const backupJob = useGetBackupJobById(() => route.params.id as AnyXoBackupJob['id'])
</script>
