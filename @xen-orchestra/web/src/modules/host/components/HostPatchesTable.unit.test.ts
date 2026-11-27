import HostPatchesTable from '@/modules/host/components/HostPatchesTable.vue'
import type { MissingPatch } from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import { findTableRows } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { MISSING_PATCHES } from '@/test/missing-patches.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import { mount } from '@vue/test-utils'

function mountTable(patches: MissingPatch[]) {
  return mount(HostPatchesTable, {
    props: { patches },
    global: createGlobalTestConfig(),
  })
}

it('lists one row per patch, with its name and its version', () => {
  const wrapper = mountTable(MISSING_PATCHES)

  expect(findTableRows(wrapper)).toEqual([
    ['XSAPATCH-1', '1.0'],
    ['XSAPATCH-2', '2.0'],
  ])
  expect(findStateHeroTexts(wrapper)).toEqual([])
})

it('lists each patch known only by its date, without version', () => {
  const wrapper = mountTable([
    { name: 'XSAPATCH-1', date: '2026-01-01' },
    { name: 'XSAPATCH-1', date: '2026-02-01' },
  ])

  expect(findTableRows(wrapper)).toEqual([
    ['XSAPATCH-1', ''],
    ['XSAPATCH-1', ''],
  ])
})

it('reports the host as up to date without patch', () => {
  const wrapper = mountTable([])

  expect(findStateHeroTexts(wrapper)).toEqual([expect.stringContaining(t('patches-up-to-date'))])
  expect(findTableRows(wrapper)).toEqual([])
})
