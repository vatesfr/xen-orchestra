<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <BackupRepositoryInfosCard :br />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/Panel/card/BackupRepositoryInfosCard.vue'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { logicAnd } from '@vueuse/math'

defineProps<{
  br?: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  close: []
}>()

const { areBackupRepositoriesReady: areBrsReady } = useXoBackupRepositoryCollection()

const isReady = logicAnd(areBrsReady)
</script>
