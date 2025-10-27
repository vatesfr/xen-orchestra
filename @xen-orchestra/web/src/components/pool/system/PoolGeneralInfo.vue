<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <UiLabelValue :label="t('name')" :value="pool.name_label" />
    <UiLabelValue :label="t('uuid')" :value="pool.id" />
    <UiLabelValue :label="t('description')" :value="pool.name_description" />
    <UiLabelValue :label="t('tags')">
      <template v-if="pool.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in pool.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ pool: XoPool }>()

const { t } = useI18n()
</script>
