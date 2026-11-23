import { useEventListener, useMutationObserver } from '@vueuse/core'
import { type MaybeRefOrGetter, onMounted, toValue } from 'vue'

const TAB_SELECTOR = '[role="tab"]'

const SELECTED_TAB_SELECTOR = '[role="tab"][aria-selected="true"]'

const INTERACTIVE_SELECTOR = 'a, button'

export function useTabListNavigation(scrollContainer: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  let centeredTab: Element | undefined

  function getTabs() {
    return Array.from(toValue(scrollContainer)?.querySelectorAll<HTMLElement>(TAB_SELECTOR) ?? [])
  }

  function getEnabledTabs() {
    return getTabs().filter(tab => tab.getAttribute('aria-disabled') !== 'true')
  }

  function findTabIndex(tabs: HTMLElement[], target: EventTarget | null) {
    if (!(target instanceof Node)) {
      return -1
    }

    return tabs.findIndex(tab => tab.contains(target))
  }

  function updateTabIndexes() {
    const enabledTabs = getEnabledTabs()
    const currentTab = enabledTabs.find(tab => tab.matches(SELECTED_TAB_SELECTOR)) ?? enabledTabs[0]

    getTabs().forEach(tab => {
      tab.tabIndex = tab === currentTab ? 0 : -1

      tab.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach(element => {
        element.tabIndex = -1
      })
    })
  }

  function centerTab(tab: Element, behavior?: ScrollBehavior) {
    const container = toValue(scrollContainer)

    if (container === null || container === undefined) {
      return
    }

    const containerRect = container.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()

    container.scrollBy({
      left: tabRect.left + tabRect.width / 2 - containerRect.left - containerRect.width / 2,
      behavior,
    })
  }

  function centerSelectedTab(behavior?: ScrollBehavior) {
    const selectedTab = toValue(scrollContainer)?.querySelector(SELECTED_TAB_SELECTOR) ?? undefined

    if (selectedTab === undefined || selectedTab === centeredTab) {
      return
    }

    centeredTab = selectedTab

    centerTab(selectedTab, behavior)
  }

  function activateTab(tab: HTMLElement, target: HTMLElement, key: string) {
    if (target.matches('button') || (key === 'Enter' && target.matches('a'))) {
      return false
    }

    const activationTarget = target.matches('a')
      ? target
      : (tab.querySelector<HTMLElement>(INTERACTIVE_SELECTOR) ?? tab)

    activationTarget.click()

    return true
  }

  function getTabToFocus(tabs: HTMLElement[], index: number, key: string) {
    switch (key) {
      case 'ArrowLeft':
        return tabs[(index - 1 + tabs.length) % tabs.length]
      case 'ArrowRight':
        return tabs[(index + 1) % tabs.length]
      case 'Home':
        return tabs[0]
      case 'End':
        return tabs[tabs.length - 1]
      default:
        return undefined
    }
  }

  useEventListener(scrollContainer, 'keydown', (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !(event.target instanceof HTMLElement)) {
      return
    }

    const tabs = getEnabledTabs()
    const index = findTabIndex(tabs, event.target)

    if (index === -1) {
      return
    }

    const tabToFocus = getTabToFocus(tabs, index, event.key)

    if (tabToFocus !== undefined) {
      tabToFocus.focus({ preventScroll: true })
      event.preventDefault()
    } else if ((event.key === 'Enter' || event.key === ' ') && activateTab(tabs[index], event.target, event.key)) {
      event.preventDefault()
    }
  })

  useEventListener(scrollContainer, 'focusin', (event: FocusEvent) => {
    const tabs = getTabs()
    const index = findTabIndex(tabs, event.target)

    if (index !== -1) {
      centerTab(tabs[index])
    }
  })

  useMutationObserver(
    scrollContainer,
    () => {
      updateTabIndexes()
      centerSelectedTab()
    },
    { childList: true, subtree: true, attributeFilter: ['aria-selected', 'aria-disabled'] }
  )

  onMounted(() => {
    updateTabIndexes()
    centerSelectedTab('instant')
  })
}
