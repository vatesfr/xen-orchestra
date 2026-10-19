<template>
  <UiPanelCard class="plugin-infos-card">
    <UiPanelCardTitle :id="plugin.id" size="medium" :label="plugin.name" :to="pluginRoute" icon="object:plugin" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template #value>{{ plugin.version }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ description }}</template>
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
    </div>
    <UiAlert v-if="!plugin.configured" accent="warning">{{ t('plugin:needs-configuration-short') }}</UiAlert>
    <PluginStateToggles :plugin vertical />
    <UiButton variant="primary" accent="brand" size="medium" class="open-button" @click="goToPluginPage()">
      {{ plugin.configured ? t('plugin:open-page') : t('action:configure') }}
    </UiButton>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import PluginStateToggles from '@/modules/plugin/components/PluginStateToggles.vue'
import { useXoPluginUtils } from '@/modules/plugin/composables/xo-plugin-utils.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()

const router = useRouter()

const { description, keywords, configurationStatus } = useXoPluginUtils(() => plugin)

const pluginRoute = computed(() => ({ name: '/admin/plugin/[id]', params: { id: plugin.id } }) as const)

const goToPluginPage = () => router.push(pluginRoute.value)
</script>

<style scoped lang="postcss">
.plugin-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .open-button {
    width: 100%;
  }
}
</style>
