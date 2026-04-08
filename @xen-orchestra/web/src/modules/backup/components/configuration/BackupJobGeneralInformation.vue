<template>
  <UiCard>
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <VtsColumns>
      <VtsColumn>
        <VtsKeyValueList>
          <VtsKeyValueRow :label="t('name')" :value="backupJob.name" />
        </VtsKeyValueList>
      </VtsColumn>
      <VtsColumn>
        <VtsKeyValueList>
          <VtsKeyValueRow :label="t('id')" :value="backupJob.id" />
        </VtsKeyValueList>
      </VtsColumn>
      <VtsColumn>
        <VtsKeyValueList>
          <VtsKeyValueRow :label="t('modes')">
            <template v-if="modeLabels.length > 0" #value>
              <UiTagsList>
                <UiTag v-for="label in modeLabels" :key="label" variant="secondary" accent="info">
                  {{ label }}
                </UiTag>
              </UiTagsList>
            </template>
          </VtsKeyValueRow>
        </VtsKeyValueList>
      </VtsColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupUtils } from '@/modules/backup/composables/xo-backup-utils.composable.ts'
import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: FrontXoVmBackupJob
}>()

const { t } = useI18n()

const { getModeLabels } = useXoBackupUtils()

const modeLabels = computed(() => getModeLabels(backupJob))
</script>
