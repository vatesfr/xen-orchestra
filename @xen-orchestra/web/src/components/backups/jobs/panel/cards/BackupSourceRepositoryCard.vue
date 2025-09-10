<template>
  <UiCard v-if="sourceBackupRepository !== undefined" class="card-container">
    <UiCardTitle>
      {{ t('source-backup-repository') }}
    </UiCardTitle>
    <UiLink size="small" :icon="sourceBackupRepositoryIcon" href="/#/settings/remotes">
      {{ sourceBackupRepository.name }}
    </UiLink>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryCollection } from '@/remote-resources/use-xo-br-collection.ts'
import type { XoMirrorBackupJob } from '@/types/xo/mirror-backup-job.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { mirrorBackupJob } = defineProps<{
  mirrorBackupJob: XoMirrorBackupJob
}>()

const { t } = useI18n()

const { getBackupRepositoryById } = useXoBackupRepositoryCollection()

const sourceBackupRepository = computed(() => getBackupRepositoryById(mirrorBackupJob.sourceRemote))

const sourceBackupRepositoryIcon = computed(() => sourceBackupRepository.value?.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected')
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
