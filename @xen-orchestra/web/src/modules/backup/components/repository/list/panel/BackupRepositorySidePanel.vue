<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <VtsStateHero v-if="!areBrsReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <BackupRepositoryInfosCard :br />
        <BackupRepositorySpaceAndSpeedCard :br />
        <BackupRepositoryNfsCard v-if="nfs" :nfs />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/panel/card/BackupRepositoryInfosCard.vue'
import BackupRepositoryNfsCard from '@/modules/backup/components/repository/list/panel/card/BackupRepositoryNfsCard.vue'
import BackupRepositorySpaceAndSpeedCard from '@/modules/backup/components/repository/list/panel/card/BackupRepositorySpaceAndSpeedCard.vue'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { parseBackupRepositoryUrl } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
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

const nfs = computed(() => {
  const parsed = br === undefined ? undefined : parseBackupRepositoryUrl(br.url)

  return parsed?.type === 'nfs' ? parsed : undefined
})
</script>
