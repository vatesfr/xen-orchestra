<template>
  <VtsStateHero v-if="!arePluginsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!plugin" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <template v-else>
    <PluginHeader v-if="uiStore.hasUi" :key="plugin.id" :plugin />
    <div :key="plugin.id" class="container">
      <UiAlert v-if="!plugin.configured" accent="warning">{{ t('plugin:needs-configuration') }}</UiAlert>
      <VtsColumns>
        <VtsColumn>
          <PluginGeneralInfo :plugin />
        </VtsColumn>
        <VtsColumn>
          <PluginConfigurationDetail :plugin />
        </VtsColumn>
      </VtsColumns>
    </div>
  </template>
</template>

<script lang="ts" setup>
import PluginConfigurationDetail from '@/modules/plugin/components/detail/PluginConfigurationDetail.vue'
import PluginGeneralInfo from '@/modules/plugin/components/detail/PluginGeneralInfo.vue'
import PluginHeader from '@/modules/plugin/components/PluginHeader.vue'
import {
  type FrontXoPlugin,
  useXoPluginCollection,
} from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/admin/plugin/[id]'>()

const uiStore = useUiStore()

const { t } = useI18n()

const { useGetPluginById, arePluginsReady } = useXoPluginCollection()

const plugin = useGetPluginById(() => route.params.id as FrontXoPlugin['id'])
</script>

<style scoped lang="postcss">
.container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;
}
</style>
