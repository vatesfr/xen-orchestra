import { useV2vSelectedVmsPanel } from '@/modules/v2v/composables/use-v2v-selected-vms-panel.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { resizeToSmallScreen } from '@/test/screen-size.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { usePanelStore } from '@core/stores/panel.store.ts'
import { h } from 'vue'

// Beside the side panel it drives, as in the step: the side panel opens on its own the panel of a selection
function mountSelectedVmsPanel() {
  mountComposable(() => useV2vSelectedVmsPanel(), {
    render: () => h(VtsSidePanel, { hasSelection: true, persistent: true }),
  })
}

beforeEach(() => {
  localStorage.clear()
})

describe('on a small screen', () => {
  it('closes the panel at load, even open before', async () => {
    await resizeToSmallScreen()
    mountSelectedVmsPanel()

    expect(usePanelStore().isExpanded).toBe(false)
  })

  it('closes the panel on going to a small screen', async () => {
    mountSelectedVmsPanel()

    await resizeToSmallScreen()

    expect(usePanelStore().isExpanded).toBe(false)
  })
})
