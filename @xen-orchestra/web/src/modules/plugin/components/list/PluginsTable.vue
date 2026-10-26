<template>
  <UiTitle>{{ t('plugins') }}</UiTitle>
  <VtsQueryBuilder v-model="filter" :schema />

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="plugin of paginatedPlugins" :key="plugin.id" :selected="selectedPluginId === plugin.id">
        <BodyCells :item="plugin" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { getPluginDescription, getPluginRoute, isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { usePluginColumns } from '@core/tables/column-sets/plugin-columns.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { useI18n } from 'vue-i18n'

const { plugins, busy, error } = defineProps<{
  plugins: FrontXoPlugin[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { items: filteredPlugins, filter } = useQueryBuilderFilter('plugins', () => plugins)

// the recursive JSON schemas cannot be walked by the query builder types
const schema = useQueryBuilderSchema<Omit<FrontXoPlugin, 'configurationSchema' | 'testSchema'>>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  description: useStringSchema(t('description')),
  loaded: useBooleanSchema(t('loaded'), { true: t('enabled'), false: t('disabled') }),
  autoload: useBooleanSchema(t('load-at-startup'), { true: t('enabled'), false: t('disabled') }),
})

const selectedPluginId = useRouteQuery('id')

const { pageRecords: paginatedPlugins, paginationBindings } = usePagination('plugins', filteredPlugins)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    plugins.length === 0 ? t('no-plugin-detected') : filteredPlugins.value.length === 0 ? { type: 'no-result' } : false,
})

const { HeadCells, BodyCells } = usePluginColumns({
  body: (plugin: FrontXoPlugin) => {
    const { configureAction, loadAction, moreActions } = useXoPluginActions(() => plugin)

    return {
      plugin: r =>
        r({
          label: plugin.name,
          to: getPluginRoute(plugin.id),
          icon: 'object:plugin',
        }),
      version: r => r(plugin.version ?? ''),
      description: r => r(getPluginDescription(plugin) ?? ''),
      loaded: r => r(isPluginLoaded(plugin)),
      autoload: r => r(plugin.autoload),
      actions: r =>
        r({
          onClick: () => (selectedPluginId.value = plugin.id),
          actions: [configureAction.value, loadAction.value, ...moreActions.value],
        }),
    }
  },
})
</script>
