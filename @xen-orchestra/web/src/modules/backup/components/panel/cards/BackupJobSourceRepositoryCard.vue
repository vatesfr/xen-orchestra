<template>
  <UiCard v-if="sourceBackupRepository !== undefined" class="card-container">
    <UiCardTitle>
      {{ t('source-backup-repository') }}
    </UiCardTitle>
    <UiLink size="small" :icon="sourceBackupRepositoryIcon" :href>
      {{ sourceBackupRepository.name }}
    </UiLink>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-br-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoMirrorBackupJob } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { mirrorBackupJob } = defineProps<{
  mirrorBackupJob: XoMirrorBackupJob
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route('/settings/remotes'))

const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

const sourceBackupRepository = useGetBackupRepositoryById(() => mirrorBackupJob.sourceRemote)

const sourceBackupRepositoryIcon = computed(() =>
  sourceBackupRepository.value?.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
)
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
