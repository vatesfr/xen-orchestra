import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { ref } from 'vue'

type PluginActions = ReturnType<typeof useXoPluginActions>

type PluginActionName = Exclude<keyof PluginActions, 'moreActions'>

export function createPluginActions(overrides: Partial<Record<PluginActionName, Partial<LeafActionItem>>> = {}) {
  const loadAction = createActionItem({ label: 'Load', icon: 'action:connect', ...overrides.loadAction })
  const configureAction = createActionItem({ label: 'Configure', icon: 'action:edit', ...overrides.configureAction })
  const autoloadAction = createActionItem({ label: 'Enable load at startup', ...overrides.autoloadAction })
  const testAction = createActionItem({ label: 'Test plugin', ...overrides.testAction })
  const deleteConfigurationAction = createActionItem({
    label: 'Delete configuration',
    separator: true,
    ...overrides.deleteConfigurationAction,
  })

  return {
    loadAction: ref(loadAction),
    autoloadAction: ref(autoloadAction),
    configureAction: ref(configureAction),
    testAction: ref(testAction),
    deleteConfigurationAction: ref(deleteConfigurationAction),
    moreActions: ref([autoloadAction, testAction, deleteConfigurationAction]),
  }
}
