<template>
  <UiPanelCard>
    <UiPanelCardTitle :id="plugin.id" size="medium" :label="plugin.name" :to="pluginRoute" icon="object:plugin" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template #value>{{ plugin.version }}</template>
        <template v-if="plugin.version" #addons>
          <VtsCopyButton :value="plugin.version" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ description }}</template>
        <template v-if="description" #addons>
          <VtsCopyButton :value="description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="keywords.length > 0" align-top>
        <template #key>{{ t('keywords') }}</template>
        <template #value>
          <UiTagsList>
            <VtsTag v-for="keyword of keywords" :key="keyword" :value="keyword" />
          </UiTagsList>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('configuration') }}</template>
        <template #value>{{ configurationStatus }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('loaded') }}</template>
        <template #value><VtsStatus :status="isLoaded" /></template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('load-at-startup') }}</template>
        <template #value><VtsStatus :status="plugin.autoload" /></template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
    <UiAlert v-if="!plugin.configured" accent="warning">{{ t('plugin:needs-configuration-short') }}</UiAlert>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoPluginUtils } from '@/modules/plugin/composables/xo-plugin-utils.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { getPluginRoute } from '@/modules/plugin/utils/xo-plugin.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()

const { description, isLoaded, keywords, configurationStatus } = useXoPluginUtils(() => plugin)

const pluginRoute = computed(() => getPluginRoute(plugin.id))
</script>
