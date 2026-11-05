<template>
  <UiHeadBar icon="object:plugin">{{ t('plugins') }}</UiHeadBar>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <PluginsTable :plugins :busy="!arePluginsReady" :error="hasPluginFetchError" />
      </UiCard>
    </div>

    <PluginSidePanel :plugin="selectedPlugin" @close="selectedPlugin = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import PluginSidePanel from '@/modules/plugin/components/list/panel/PluginSidePanel.vue'
import PluginsTable from '@/modules/plugin/components/list/PluginsTable.vue'
import {
  type FrontXoPlugin,
  useXoPluginCollection,
} from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { plugins, getPluginById, arePluginsReady, hasPluginFetchError } = useXoPluginCollection()

const selectedPlugin = useRouteQuery<FrontXoPlugin | undefined>('id', {
  toData: id => getPluginById(id as FrontXoPlugin['id']),
  toQuery: plugin => plugin?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  gap: 0.8rem;
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
