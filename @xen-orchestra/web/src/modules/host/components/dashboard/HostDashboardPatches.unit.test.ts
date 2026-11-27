import HostDashboardPatches from '@/modules/host/components/dashboard/HostDashboardPatches.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  type MissingPatch,
  useXoHostMissingPatchesCollection,
} from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findCardTitleInfo } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { itShowsHostDashboardCard } from '@/test/host-dashboard-card.ts'
import { t } from '@/test/i18n.ts'
import { findTablePatches, MISSING_PATCHES } from '@/test/missing-patches.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { hasLoader } from '@core-test/expect-loader.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const useXoHostMissingPatchesCollectionMock = mockedExport(useXoHostMissingPatchesCollection)

const host = createHost({ id: 'host-1' as FrontXoHost['id'] })

function givenMissingPatches(missingPatches: MissingPatch[], areReady = true) {
  useXoHostMissingPatchesCollectionMock.mockReturnValue({
    hostMissingPatches: ref(missingPatches),
    areHostMissingPatchesReady: ref(areReady),
  })
}

beforeEach(() => {
  givenMissingPatches([])
})

function mountPatches() {
  return mount(HostDashboardPatches, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

itShowsHostDashboardCard(mountPatches, { title: t('patches') })

it('counts the missing patches next to the title', () => {
  givenMissingPatches(MISSING_PATCHES)

  const wrapper = mountPatches()

  expect(findCardTitleInfo(wrapper)).toBe(t('n-missing', 2))
})

it('leaves out the count when the host misses no patch', () => {
  const wrapper = mountPatches()

  expect(findCardTitleInfo(wrapper)).toBeUndefined()
})

it('hands each missing patch to the table', () => {
  givenMissingPatches(MISSING_PATCHES)

  const wrapper = mountPatches()

  expect(findTablePatches(wrapper)).toEqual(MISSING_PATCHES)
})

it('hands no patch to the table when the host misses no patch', () => {
  const wrapper = mountPatches()

  expect(findTablePatches(wrapper)).toEqual([])
})

it('hands no patch to the table, without loader, while the patches of the host are still loading', () => {
  givenMissingPatches([], false)

  const wrapper = mountPatches()

  expect(findTablePatches(wrapper)).toEqual([])
  expect(hasLoader(wrapper)).toBe(false)
})
