<template>
  <div class="backup-job-vms-dynamic-selection">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsQueryBuilderPreview
      v-if="filter !== ''"
      :filter
      :schema
      :items="previewItems"
      :count-label="t('n-vms', { n: previewItems.length })"
    />
  </div>
</template>

<script lang="ts" setup>
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import { useVmQueryPreviewItems } from '@/modules/vm/composables/use-vm-query-preview-items.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsQueryBuilderPreview from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { vms } = useXoVmCollection()

const { items, filter, schema } = useVmQueryBuilder('backup-job-vms', vms, { ignoreRoute: true })

const previewItems = useVmQueryPreviewItems(items)
</script>

<style lang="postcss" scoped>
.backup-job-vms-dynamic-selection {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
