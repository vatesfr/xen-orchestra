<template>
  <UiCard>
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('description')" :value="description" />
      <VtsTabularKeyValueRow :label="t('keywords')">
        <template v-if="keywords.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="keyword of keywords" :key="keyword" :value="keyword" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoPluginUtils } from '@/modules/plugin/composables/xo-plugin-utils.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()

const { description, keywords } = useXoPluginUtils(() => plugin)
</script>
