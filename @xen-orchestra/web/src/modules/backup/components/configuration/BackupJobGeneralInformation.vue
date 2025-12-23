<template>
  <UiCard>
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('name')" :value="backupJob.name" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('id')" :value="backupJob.id" />
      </VtsColumn>
      <VtsColumn>
        <VtsQuickInfoRow :label="t('modes')">
          <template v-if="modeLabels.length > 0" #value>
            <UiTagsList>
              <UiTag v-for="label in modeLabels" :key="label" variant="secondary" accent="info">
                {{ label }}
              </UiTag>
            </UiTagsList>
          </template>
        </VtsQuickInfoRow>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import { useBackupUtils } from '@/modules/backup/composables/backup-utils.composable.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVmBackupJob } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
}>()

const { t } = useI18n()

const { getModeLabels } = useBackupUtils()

const modeLabels = computed(() => getModeLabels(backupJob))
</script>
