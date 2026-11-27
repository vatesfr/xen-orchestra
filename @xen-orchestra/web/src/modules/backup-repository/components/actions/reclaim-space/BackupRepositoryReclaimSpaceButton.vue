<template>
  <VtsActionButton
    :hint="reclaimSpaceErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:reclaim-space"
    :disabled="!canReclaimSpace"
    :busy="isReclaimingSpace"
    @click="reclaimSpace()"
  >
    {{ t('action:reclaim-space') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryReclaimSpaceJob } from '@/modules/backup-repository/jobs/xo-backup-repository-reclaim-space.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const {
  run: reclaimSpace,
  canRun: canReclaimSpace,
  isRunning: isReclaimingSpace,
  errorMessage: reclaimSpaceErrorMessage,
} = useXoBackupRepositoryReclaimSpaceJob(() => [br])
</script>
