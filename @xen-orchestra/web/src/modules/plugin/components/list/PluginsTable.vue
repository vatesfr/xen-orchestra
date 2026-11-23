<template>
  <UiTitle>{{ t('plugins') }}</UiTitle>
  <VtsQueryBuilder v-bind="searchBindings" :schema />

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
import { useStatusLabel } from '@core/composables/status-label.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { usePluginColumns } from '@core/tables/column-sets/plugin-columns.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { plugins, busy, error } = defineProps<{
  plugins: FrontXoPlugin[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { items: filteredPlugins, searchBindings } = useQueryBuilderFilter('plugins', () => plugins)

// the recursive JSON schemas cannot be walked by the query builder types
const schema = useQueryBuilderSchema<Omit<FrontXoPlugin, 'configurationSchema' | 'testSchema'>>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  description: useStringSchema(t('description')),
  loaded: useBooleanSchema(t('loaded'), { true: t('enabled'), false: t('disabled') }),
  autoload: useBooleanSchema(t('load-at-startup'), { true: t('enabled'), false: t('disabled') }),
})

const selectedPluginId = useRouteQuery('id')

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    plugins.length === 0 ? t('no-plugin-detected') : filteredPlugins.value.length === 0 ? { type: 'no-result' } : false,
})

const { compareStatuses } = useStatusLabel()

const { HeadCells, BodyCells, sortItems } = usePluginColumns({
  id: 'plugins',
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
  sort: {
    plugin: (plugin1, plugin2) => compareStrings(plugin1.name, plugin2.name),
    version: (plugin1, plugin2) => compareStrings(plugin1.version ?? '', plugin2.version ?? ''),
    description: (plugin1, plugin2) =>
      compareStrings(getPluginDescription(plugin1) ?? '', getPluginDescription(plugin2) ?? ''),
    loaded: (plugin1, plugin2) => compareStatuses(isPluginLoaded(plugin1), isPluginLoaded(plugin2)),
    autoload: (plugin1, plugin2) => compareStatuses(plugin1.autoload, plugin2.autoload),
  },
  initialSort: { id: 'plugin', direction: 'asc' },
})

const sortedPlugins = computed(() => sortItems(filteredPlugins.value))

const { pageRecords: paginatedPlugins, paginationBindings } = usePagination('plugins', sortedPlugins)
</script>
