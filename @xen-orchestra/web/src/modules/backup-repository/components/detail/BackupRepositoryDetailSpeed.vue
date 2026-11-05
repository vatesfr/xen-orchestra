<template>
  <UiCard>
    <UiTitle>
      {{ t('speed') }}
      <template #action>
        <BackupRepositoryBenchmarkButton :br />
      </template>
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('writing-speed')" :value="writeSpeed" />
      <VtsTabularKeyValueRow :label="t('reading-speed')" :value="readSpeed" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import BackupRepositoryBenchmarkButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryBenchmarkButton.vue'
import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { writeSpeed, readSpeed } = useXoBackupRepositoryBenchmark(() => br)
</script>
