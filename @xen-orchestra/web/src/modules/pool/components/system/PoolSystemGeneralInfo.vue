<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('name')" no-value-tooltip>
      <template #value>
        <span v-tooltip class="text-ellipsis">{{ pool.name_label }}</span>
        <VtsCopyButton v-if="pool.name_label" :value="pool.name_label" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('uuid')" no-value-tooltip>
      <template #value>
        <span v-tooltip class="text-ellipsis">{{ pool.id }}</span>
        <VtsCopyButton :value="pool.id" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('description')" :value="pool.name_description" />
    <VtsQuickInfoRow :label="t('tags')">
      <template v-if="pool.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in pool.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{ pool: FrontXoPool }>()

const { t } = useI18n()
</script>
