import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import type { V2vNextTransfer } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
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

it.each([
  ['delta', t('delta-transfer')],
  ['full', t('full-transfer')],
] as const)('titles the %s transfer of the next run', (transfer, label) => {
  expect(findCardTitle(mountCard({ transfer }))).toBe(`${t('next-run')} ${label}`)
})

it('tells when the VM was last synced', () => {
  expect(findLabelledValues(mountCard())).toEqual({ [t('last-sync')]: formatDateTime(LAST_SYNC_AT) })
})

it('leaves the last sync empty for a VM without one', () => {
  expect(findLabelledValues(mountCard({ lastSyncAt: undefined }))).toEqual({ [t('last-sync')]: '' })
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
