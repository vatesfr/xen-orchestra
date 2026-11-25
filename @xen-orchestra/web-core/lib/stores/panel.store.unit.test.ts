import { usePanelStore } from '@core/stores/panel.store.ts'
import { mountComposable } from '@core-test/mount-composable.ts'
import { nextTick } from 'vue'

function mountPanelStore({ isExpanded, isLocked }: { isExpanded: boolean; isLocked: boolean }) {
  localStorage.setItem('panel.expanded', String(isExpanded))
  localStorage.setItem('panel.locked', String(isLocked))

  const { wrapper } = mountComposable(() => ({ panelStore: usePanelStore() }))

  return wrapper.vm.panelStore
}

async function changeFromAnotherTab(key: string, value: boolean) {
  const oldValue = localStorage.getItem(key)
  const newValue = String(value)

  localStorage.setItem(key, newValue)
  window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue, storageArea: localStorage }))
  await nextTick()
}

beforeEach(() => {
  localStorage.clear()
})

describe('isExpanded', () => {
  it('stays true when another tab collapses its panel', async () => {
    const panelStore = mountPanelStore({ isExpanded: true, isLocked: false })

    await changeFromAnotherTab('panel.expanded', false)

    expect(panelStore.isExpanded).toBe(true)
  })

  it('stays false when another tab expands its panel', async () => {
    const panelStore = mountPanelStore({ isExpanded: false, isLocked: false })

    await changeFromAnotherTab('panel.expanded', true)

    expect(panelStore.isExpanded).toBe(false)
  })

  it('becomes true when another tab locks the panel', async () => {
    const panelStore = mountPanelStore({ isExpanded: false, isLocked: false })

    await changeFromAnotherTab('panel.locked', true)

    expect(panelStore.isLocked).toBe(true)
    expect(panelStore.isExpanded).toBe(true)
  })
})

describe('toggleLock', () => {
  it('expands the collapsed panel when locking it', async () => {
    const panelStore = mountPanelStore({ isExpanded: false, isLocked: false })

    panelStore.toggleLock()
    await nextTick()

    expect(panelStore.isLocked).toBe(true)
    expect(panelStore.isExpanded).toBe(true)
  })
})
