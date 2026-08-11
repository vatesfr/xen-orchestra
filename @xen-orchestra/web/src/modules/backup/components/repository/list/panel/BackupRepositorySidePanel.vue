<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <VtsStateHero v-if="!areBrsReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <BackupRepositoryInfosCard :br />
        <BackupRepositorySpaceAndSpeedCard :br />
        <BackupRepositoryNFSCard v-if="BrType === 'nfs'" :br />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/panel/card/BackupRepositoryInfosCard.vue'
import BackupRepositoryNFSCard from '@/modules/backup/components/repository/list/panel/card/BackupRepositoryNFSCard.vue'
import BackupRepositorySpaceAndSpeedCard from '@/modules/backup/components/repository/list/panel/card/BackupRepositorySpaceAndSpeedCard.vue'
import { getBackupRepositoryType } from '@/modules/backup/components/utils/xo-backup-repository.utils.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'

const { br } = defineProps<{
  br?: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  close: []
}>()

const { areBackupRepositoriesReady: areBrsReady } = useXoBackupRepositoryCollection()

const BrType = computed(() => (br === undefined ? undefined : getBackupRepositoryType(br.url)))
</script>
