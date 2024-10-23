import type { Menu, MenuOptions } from '@core/modules/menu/type'
import { uniqueId } from '@core/utils/unique-id.util'
import { computed, type EffectScope, effectScope, reactive, ref } from 'vue'

export type MenuContext = {
  id: string
  options: MenuOptions<Menu<any>>
  registerItem: (item: Menu<any>) => void
  isItemActive: (itemId: string) => boolean
  activateItem: (itemId: string) => void
  deactivateItem: (itemId: string) => void
  deactivateAllItems: () => void
  deactivateSiblingItems: (itemIdToKeep: string) => void
  hasActiveItems: boolean
  hasItemChildren: (itemId: string) => boolean
  registerTrigger: (itemId: string, triggerElement: HTMLElement) => void
  getTrigger: (itemId: string) => HTMLElement | undefined
  startScope: (scopeId: string, cb: () => void) => void
  stopScope: (scopeId: string) => void
}

export function useMenuContext(options: MenuOptions<any>): MenuContext {
  const id = uniqueId('data-menu-context')
  const items = reactive(new Map()) as Map<string, Menu<any>>
  const activeItems = ref(new Set<string>())
  const hasActiveItems = computed(() => activeItems.value.size > 0)
  const effectScopes = new Map<string, EffectScope>()

  function registerItem(item: Menu<any>) {
    items.set(item.$id, item)
  }

  function isItemActive(itemId: string) {
    return activeItems.value.has(itemId)
  }

  function activateItem(itemId: string) {
    activeItems.value.add(itemId)
  }

  function deactivateItem(itemId: string) {
    activeItems.value.delete(itemId)
  }

  function deactivateSiblingItems(itemIdToKeep: string) {
    const itemToKeep = items.get(itemIdToKeep)

    if (!itemToKeep) {
      return
    }

    const siblingItems = Array.from(items.values()).filter(
      siblingItem => siblingItem.$id !== itemIdToKeep && siblingItem.$parentId === itemToKeep.$parentId
    )

    siblingItems.forEach(siblingItem => {
      deactivateItem(siblingItem.$id)
    })
  }

  function deactivateAllItems() {
    activeItems.value.clear()
  }

  function hasItemChildren(itemId: string) {
    return Array.from(items.values()).some(item => item.$parentId === itemId)
  }

  const triggers = reactive(new Map<string, HTMLElement>())

  function registerTrigger(itemId: string, triggerElement: HTMLElement) {
    triggers.set(itemId, triggerElement)
  }

  function getTrigger(itemId: string) {
    return triggers.get(itemId)
  }

  function startScope(scopeId: string, cb: () => void) {
    const scope = effectScope()
    effectScopes.set(scopeId, scope)
    scope.run(cb)
  }

  function stopScope(scopeId: string) {
    effectScopes.get(scopeId)?.stop()
    effectScopes.delete(scopeId)
  }

  return reactive({
    id,
    options,
    registerItem,
    hasActiveItems,
    isItemActive,
    activateItem,
    deactivateItem,
    deactivateAllItems,
    deactivateSiblingItems,
    hasItemChildren,
    registerTrigger,
    getTrigger,
    startScope,
    stopScope,
  })
}
