<template>
  <VtsStateHero v-if="!areBackupRepositoriesReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!br" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <BackupRepositoryHeader v-if="uiStore.hasUi" :br />
    <component :is="Component" :br />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupRepositoryHeader from '@/modules/backup-repository/components/BackupRepositoryHeader.vue'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/backup-repository/[id]'>()
const uiStore = useUiStore()
const { t } = useI18n()

const { useGetBackupRepositoryById, areBackupRepositoriesReady } = useXoBackupRepositoryCollection()

const br = useGetBackupRepositoryById(() => route.params.id as FrontXoBackupRepository['id'])
</script>
