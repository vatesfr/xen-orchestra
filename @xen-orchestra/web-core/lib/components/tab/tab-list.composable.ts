import type { Tab, TabList } from '@core/components/tab/tab.type'
import { computed, type MaybeRefOrGetter, type Ref, toRef } from 'vue'

export function useTabList<TName extends string>(names: TName[], initialTab?: MaybeRefOrGetter<TName>) {
  const currentTab = toRef(initialTab) as Ref<TName | undefined>

  const activate = (name: TName | undefined) => {
    currentTab.value = name
  }

  const isActive = (name: TName) => currentTab.value === name

  const tabs = computed(() => {
    return Object.fromEntries(
      names.map(name => [
        name,
        {
          isActive: isActive(name),
          activate: () => activate(name),
          bindings: {
            onClick: (event: MouseEvent) => {
              event.preventDefault()
              activate(name)
            },
            selected: isActive(name),
          },
        },
      ])
    ) as Record<TName, Tab>
  })

  return { currentTab, activate, isActive, tabs } as TabList<TName>
}
