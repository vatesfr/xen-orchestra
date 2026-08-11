<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <BackupRepositoryInfosCard :br />
        <BackupRepositorySpaceAndSpeedCard :br />
        <BackupRepositoryNFSCard v-if="BrType === 'nfs'" :br />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/Panel/card/BackupRepositoryInfosCard.vue'
import BackupRepositoryNFSCard from '@/modules/backup/components/repository/list/Panel/card/BackupRepositoryNFSCard.vue'
import BackupRepositorySpaceAndSpeedCard from '@/modules/backup/components/repository/list/Panel/card/BackupRepositorySpaceAndSpeedCard.vue'
import { getBackupRepositoryType } from '@/modules/backup/components/utils/xo-backup-repository.utils.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { br } = defineProps<{
  br?: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  close: []
}>()

const { areBackupRepositoriesReady: areBrsReady } = useXoBackupRepositoryCollection()

const isReady = logicAnd(areBrsReady)

const BrType = computed(() => getBackupRepositoryType(br !== undefined ? br.url : ''))
</script>
