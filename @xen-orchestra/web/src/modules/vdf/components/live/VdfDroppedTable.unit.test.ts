import VdfDroppedTable, { type VdfDroppedRow } from '@/modules/vdf/components/live/VdfDroppedTable.vue'
import type { useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock(import('@/modules/vdf/composables/vdf-quarantine.composable.ts'), () => ({
  useVdfQuarantine: (() => ({
    quarantineAction: () => ({ label: 'Quarantine', onClick: () => undefined }),
  })) as unknown as typeof useVdfQuarantine,
}))

const row = (fields: Partial<VdfDroppedRow> = {}): VdfDroppedRow => ({
  key: 'r1',
  src: { ip: '10.0.0.7', groups: [] },
  dst: { ip: '10.0.0.5' },
  revoked: false,
  rate: '0.4',
  traceLabel: 'trace',
  ...fields,
})

const mountTable = (rows: VdfDroppedRow[], rateLabel?: string) =>
  mount(VdfDroppedTable, {
    props: { scopeId: 'pool-1', rows, rateLabel },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })

// UX P2-8: a row's menu allows, traces, then quarantines; every row has one
it("offers to allow a dropped flow and to trace it, from the row's menu", async () => {
  const wrapper = mountTable([
    row({
      proto: 'tcp',
      port: '5432',
      trace: { name: '/pool/[id]/firewall/trace', params: { id: 'pool-1' } },
      decision: { label: 'db', name: 'db', tier: 'Application', isGlobal: false, route: '/', policy: 'db' },
    }),
  ])

  await wrapper.get('td:last-child button').trigger('click')
  await flushPromises()

  const items = [...document.body.querySelectorAll('.menu-item')].map(item => item.textContent?.trim())

  expect(items).toEqual([t('firewall:trace:allow-flow'), t('firewall:monitor:trace')])
  wrapper.unmount()
})

it('keeps the column, a disabled button, when a row offers nothing', () => {
  const wrapper = mountTable([row()])

  expect(wrapper.get('td:last-child button').attributes('disabled')).toBeDefined()
  wrapper.unmount()
})

// UX P2-7: the rate column says what it holds
it('names the rate column as its caller says', () => {
  const wrapper = mountTable([row()], 'Dropped (15 min)')

  expect(wrapper.text()).toContain('Dropped (15 min)')
  wrapper.unmount()
})
