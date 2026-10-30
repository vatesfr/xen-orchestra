<template>
  <div class="backup-job-form-dynamic-selection">
    <BackupJobFormQueryInput v-model="filter" :label="t('dynamic-selection-query')" :schema :error required />
    <VtsQueryBuilderPreview v-if="filter !== ''" :filter :schema :items :count-label />
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormQueryInput from '@/modules/backup-job/components/form/inputs/BackupJobFormQueryInput.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import VtsQueryBuilderPreview, {
  type QueryBuilderPreviewItem,
} from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  schema: QueryBuilderSchema
  items: QueryBuilderPreviewItem[]
  countLabel: string
  error?: InputWrapperMessage
}>()

const filter = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-form-dynamic-selection {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
