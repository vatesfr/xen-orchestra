<template>
  <UiCard class="pool-general-info">
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('name')" :value="pool.name_label" />
    <VtsQuickInfoRow :label="$t('id')" :value="pool.id" />
    <VtsQuickInfoRow :label="$t('description')" :value="pool.name_description" />
    <VtsQuickInfoRow :label="$t('tags')">
      <template v-if="pool.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in pool.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPool } from '@/types/xo/pool.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{ pool: XoPool }>()
</script>
