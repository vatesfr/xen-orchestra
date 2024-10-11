import type { Ref } from 'vue'

export type Tab = {
  isActive: boolean
  activate: () => void
  bindings: {
    onClick: (event: MouseEvent) => void
    selected: boolean
  }
}

export type TabList<TName extends string> = {
  currentTab: Ref<TName | undefined>
  activate: (name: TName | undefined) => void
  isActive: (name: TName) => boolean
  tabs: Record<TName, Tab>
}
