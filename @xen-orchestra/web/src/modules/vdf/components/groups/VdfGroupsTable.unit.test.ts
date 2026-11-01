import VdfGroupsTable, { type VdfGroupRow } from '@/modules/vdf/components/groups/VdfGroupsTable.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

// UX P3-4: the icon-only buttons are named; P3-12: what "+N" counts

const row = (fields: Partial<VdfGroupRow> = {}): VdfGroupRow => ({
  name: 'global:db',
  label: 'db',
  isGlobal: true,
  tags: ['vdf:role=db'],
  ips: ['10.1.0.20', '10.1.0.21'],
  members: [createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'vdf-db' })],
  pools: [],
  usedBy: [],
  draftState: undefined,
  actions: [],
  ...fields,
})

const mountTable = (rows: VdfGroupRow[], withPools = false) =>
  mount(VdfGroupsTable, {
    props: { id: 'groups', rows, selected: undefined, emptyMessage: '', withPools },
    global: createGlobalTestConfig(),
  })

it('names the eye and the menu of each row', () => {
  const labels = mountTable([row()])
    .findAll('.row-actions button')
    .map(button => button.attributes('aria-label'))

  expect(labels).toEqual([t('firewall:group:open', { name: 'db' }), t('firewall:group:menu', { name: 'db' })])
})

it('says what "+N" counts: in a pool, a global group\'s other pools are addresses', () => {
  const more = mountTable([row()]).get('.more')
  const summary = t('firewall:members:summary:pool-global', { vms: t('firewall:group:members', { n: 1 }, 1), n: 2 }, 2)

  expect(more.text()).toBe('+2')
  expect(more.attributes('aria-label')).toBe(t('firewall:members:show', { n: 2, summary }))
})
