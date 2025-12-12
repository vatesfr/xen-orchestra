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
      <VtsCardRowKeyValue>
        <template #key>{{ t('id') }}</template>
        <template #value>{{ backupJob.id }}</template>
        <template #addons>
          <VtsCopyButton :value="backupJob.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-for="(mode, index) in backupJobModes" :key="mode">
        <template #key>
          <template v-if="index === 0">{{ t('mode', backupJobModes.length) }}</template>
        </template>
        <template #value>
          <span class="text-ellipsis">{{ mode }}</span>
        </template>
        <template #addons>
          <VtsCopyButton :value="mode" />
          <UiButtonIcon
            v-if="index === 0 && backupJobModes.length > 1"
            v-tooltip="t('coming-soon')"
            disabled
            icon="fa:ellipsis"
            size="small"
            accent="brand"
          />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { AnyXoBackupJob } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: AnyXoBackupJob
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
