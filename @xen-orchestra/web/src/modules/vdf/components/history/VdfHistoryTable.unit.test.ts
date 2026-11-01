import VdfHistoryTable from '@/modules/vdf/components/history/VdfHistoryTable.vue'
import type { VdfHistoryEntry } from '@/modules/vdf/types.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { mount } from '@vue/test-utils'

// UX P2-10: when, and what changed, at a glance; versions without changes
// on demand

const summary = (fields: Partial<VdfHistoryEntry['summary']> = {}) => ({
  added: 0,
  removed: 0,
  modified: 0,
  groups: 1,
  policies: 1,
  rules: 1,
  ...fields,
})

const entry = (id: number, fields: Partial<VdfHistoryEntry> = {}): VdfHistoryEntry => ({
  id,
  publishedAt: '2026-10-25T14:12:00Z',
  publishedBy: 'admin@example.org',
  summary: summary(),
  ...fields,
})

const mountTable = (entries: VdfHistoryEntry[]) =>
  mount(VdfHistoryTable, {
    props: { id: 'history', entries, currentId: entries[0]?.id },
    global: createGlobalTestConfig(),
  })

it('says what changed object by object, and when', () => {
  const wrapper = mountTable([
    entry(2, {
      summary: summary({ added: 3, removed: 1 }),
      changes: {
        items: [
          {
            kind: 'policy',
            name: 'web',
            change: 'modified',
            rules: { added: 2, removed: 1, modified: 0 },
            settings: false,
          },
          { kind: 'group', name: 'cache', change: 'added' },
        ],
        more: 2,
      },
    }),
  ])
  const text = wrapper.text()

  expect(text).toContain(
    `${t('firewall:history:item:policy:modified', {
      name: 'web',
      changes: `${t('firewall:history:item:rules-added', { n: 2 }, 2)}, ${t('firewall:history:item:rules-removed', { n: 1 }, 1)}`,
    })} · ${t('firewall:history:item:group:added', { name: 'cache' })} · ${t('firewall:more', { n: 2 })}`
  )
  // the date and time, not only "2 days ago"
  expect(text).toContain('2026')
})

it('hides the versions without changes until asked', async () => {
  const wrapper = mountTable([
    entry(3, { summary: summary({ added: 1 }) }),
    entry(2),
    entry(1, { summary: summary({ added: 1 }) }),
  ])

  expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  expect(wrapper.text()).toContain(t('firewall:history:show-unchanged', { n: 1 }, 1))

  await wrapper.getComponent(UiToggle).setValue(true)

  expect(wrapper.findAll('tbody tr')).toHaveLength(3)
})
