import VdfAddVmsModal from '@/modules/vdf/components/VdfAddVmsModal.vue'
import type { useVdfMonitorShadows } from '@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

vi.mock(import('@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'), () => ({
  useVdfMonitorShadows: (() => ({
    shadowsIn: () => [],
    shadowText: () => '',
  })) as unknown as typeof useVdfMonitorShadows,
}))

const mountModal = (isPublished: boolean) =>
  mount(VdfAddVmsModal, {
    props: { group: 'web', tags: ['vdf:role=web'], candidates: [], isPublished },
    global: createGlobalTestConfig(),
  })

// UX P2-5: an unpublished group takes effect at publish, not now
it('says an unpublished group takes effect once published, and nothing else', () => {
  const text = mountModal(false).text()

  expect(text).toContain(t('firewall:add-vms:not-published'))
  expect(text).not.toContain(t('firewall:add-vms:effect'))
})

it('says a published group takes effect now', () => {
  const text = mountModal(true).text()

  expect(text).toContain(t('firewall:add-vms:effect'))
  expect(text).not.toContain(t('firewall:add-vms:not-published'))
})
