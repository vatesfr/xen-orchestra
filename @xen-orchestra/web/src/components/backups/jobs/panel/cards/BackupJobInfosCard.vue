<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="backupJob.name !== undefined" size="small" icon="object:backup-job">
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
      <VtsCardRowKeyValue>
        <template #key>{{ t('mode') }}</template>
        <template #value>
          <UiTagsList>
            <template v-for="(mode, index) in backupJobModes" :key="index">
              <UiTag v-if="mode !== undefined" accent="info" variant="secondary">{{ mode }}</UiTag>
            </template>
          </UiTagsList>
        </template>
        <template v-if="backupJobModes !== undefined" #addons>
          <VtsCopyButton :value="backupJobModes.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
}>()

const { t } = useI18n()

const { getModeLabels } = useXoBackupUtils()

const backupJobModes = computed(() => getModeLabels(backupJob))
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
