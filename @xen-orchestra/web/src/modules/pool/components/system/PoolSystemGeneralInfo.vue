<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="pool.name_label" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="pool.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="pool.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="pool.tags.length > 0" #value>
          <UiTagsList>
            <UiTag v-for="tag in pool.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ pool: FrontXoPool }>()

const { t } = useI18n()
</script>
