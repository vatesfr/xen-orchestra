import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import type { V2vNextTransfer } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findPanelCardTitle } from '@/test/find-card-title.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { mount } from '@vue/test-utils'

const LAST_SYNC_AT = Date.UTC(2026, 9, 2, 14, 40)

const REMINDER = { label: t('v2v:next-run-reminder'), accent: 'info' }

// An explicit `lastSyncAt: undefined` stands for a VM without last sync
function mountCard(props: { transfer?: V2vNextTransfer; lastSyncAt?: number } = {}) {
  return mount(V2vNextRunCard, {
    props: { transfer: 'delta', lastSyncAt: LAST_SYNC_AT, ...props },
    global: createGlobalTestConfig(),
  })
}

it('shows its title', () => {
  expect(findPanelCardTitle(mountCard())).toBe(t('next-run'))
})

it.each([
  ['delta', t('delta-transfer')],
  ['full', t('full-transfer')],
] as const)('tells the %s transfer of the next run, and when the VM was last synced', (transfer, label) => {
  expect(findCardLabelledValues(mountCard({ transfer }))).toEqual({
    [t('type')]: label,
    [t('last-sync')]: formatDateTime(LAST_SYNC_AT),
  })
})

it('leaves the last sync empty for a VM without one', () => {
  expect(findCardLabelledValues(mountCard({ lastSyncAt: undefined }))[t('last-sync')]).toBe('')
})

it('reminds to sync shortly before the cutover', () => {
  expect(findAccentedInfos(mountCard())).toEqual([REMINDER])
})

it('warns a full transfer comes from a source snapshot changed since the last sync', () => {
  expect(findAccentedInfos(mountCard({ transfer: 'full' }))).toEqual([
    { label: t('v2v:source-snapshot-changed'), accent: 'warning' },
    REMINDER,
  ])
})
