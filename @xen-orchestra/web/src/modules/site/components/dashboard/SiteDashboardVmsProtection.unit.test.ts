import SiteDashboardVmsProtection from '@/modules/site/components/dashboard/SiteDashboardVmsProtection.vue'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useVmProtectedInfoModal } from '@/shared/composables/modals/use-vm-protected-info-modal.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardHeading } from '@/test/find-card-heading.ts'
import { findLegends } from '@/test/find-labelled-values.ts'
import { isLoading } from '@/test/find-loader.ts'
import { findStateHeroText } from '@/test/find-state-hero.ts'
import { t } from '@/test/i18n.ts'
import { ref } from 'vue'

const { openVmProtectedModal } = vi.hoisted(() => ({ openVmProtectedModal: vi.fn() }))

// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()
const vms = ref([createVm()])

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/shared/composables/modals/use-vm-protected-info-modal.ts'), () => ({
  useVmProtectedInfoModal: (() => ({ open: openVmProtectedModal })) as unknown as typeof useVmProtectedInfoModal,
}))

beforeEach(() => {
  siteDashboard.reset()
  openVmProtectedModal.mockReset()
  vms.value = [createVm()]
})

const mountVmsProtection = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardVmsProtection, overrides)

it('names the card and says which runs it covers', () => {
  const wrapper = mountVmsProtection()

  expect(findCardHeading(wrapper)).toEqual({
    title: t('backups:vms-protection'),
    description: t('in-last-three-runs'),
  })
})

it('shows a loader while the backups have not arrived', () => {
  const wrapper = mountVmsProtection({ backups: undefined })

  expect(isLoading(wrapper)).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountVmsProtection()

  expect(findStateHeroText(wrapper)).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})

it('breaks down the VMs by how well they are protected', () => {
  const wrapper = mountVmsProtection()

  expect(findLegends(wrapper)).toEqual([
    [t('backups:vms-protection:protected'), '12'],
    [t('backups:vms-protection:unprotected'), '5'],
    [t('backups:vms-protection:no-active-job'), '6'],
  ])
})

it('counts every VM of the site as covered by no job when the site runs no backup job', () => {
  vms.value = [createVm(), createVm(), createVm()]

  const wrapper = mountVmsProtection({ backups: { isEmpty: true } })

  expect(findLegends(wrapper)).toEqual([
    [t('backups:vms-protection:protected'), '0'],
    [t('backups:vms-protection:unprotected'), '0'],
    [t('backups:vms-protection:no-active-job'), '3'],
  ])
})

it('explains what being protected means when asked', async () => {
  const wrapper = mountVmsProtection()

  await wrapper.get('.ui-button').trigger('click')

  expect(openVmProtectedModal).toHaveBeenCalledOnce()
})
