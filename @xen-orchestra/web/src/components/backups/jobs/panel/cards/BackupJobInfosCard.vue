<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink
        v-if="backupJob.name !== undefined"
        size="small"
        icon="object:backup-job"
        :to="`/backup/${backupJob.id}/runs`"
      >
        {{ backupJob.name }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <UiLabelValue :label="t('id')" :value="backupJob.id" :copy-value="backupJob.id" ellipsis />
      <UiLabelValue :label="t('mode')" :value="backupJobModes" :copy-value="backupJobModes" ellipsis />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
}>()

const { t } = useI18n()

const { getModeLabels } = useXoBackupUtils()

const backupJobModes = computed(() => getModeLabels(backupJob).filter(mode => mode))
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
