import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import type { V2vSelectedVm } from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import { createV2vSelectedVm } from '@/test/create-v2v-selected-vms.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { findParts } from '@/test/find-parts.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedInfos, findAccentedTags } from '@core-test/find-accented-labels.ts'
import { findLink } from '@core-test/find-links.ts'
import { getButton } from '@core-test/get-button.ts'
import { mount } from '@vue/test-utils'

const ITEM = createV2vSelectedVm()

async function mountItem(item: V2vSelectedVm = ITEM) {
  const router = await createV2vWizardRouter('vms')

  return mount(V2vSelectedVmItem, { props: { item }, global: createGlobalTestConfig({ router }) })
}

it('links the name of the VM to its mapping', async () => {
  expect(findLink(await mountItem())).toMatchObject({
    text: ITEM.name,
    href: `/admin/v2v/migrate?step=mapping&vm=${ITEM.id}`,
  })
})

it('tags the VM with its kind', async () => {
  const kind = { label: 'Resume', accent: 'info' } as const

  expect(findAccentedTags(await mountItem(createV2vSelectedVm({ kind })))).toEqual([kind])
})

it('has no kind tag without a kind', async () => {
  expect(findAccentedTags(await mountItem(createV2vSelectedVm({ kind: undefined })))).toEqual([])
})

it('lays out its mapping', async () => {
  expect(findParts(await mountItem(), '.mapping')).toEqual(ITEM.mappingParts)
})

it('has no mapping line without mapping parts', async () => {
  expect((await mountItem(createV2vSelectedVm({ mappingParts: [] }))).find('.mapping').exists()).toBe(false)
})

it('tells its check with its accent', async () => {
  const check = { label: 'Import in progress', accent: 'danger' } as const

  expect(findAccentedInfos(await mountItem(createV2vSelectedVm({ check })))).toEqual([check])
})

// The router alone marks every mapping link as current: they only differ by their query
it('does not mark its link as the current page', async () => {
  expect((await mountItem()).get('a').attributes('aria-current')).toBe('false')
})

it('removes the VM from the list', async () => {
  const wrapper = await mountItem()

  await getButton(wrapper, t('action:remove-name-from-list', { name: ITEM.name })).trigger('click')

  expect(wrapper.emitted('remove')).toEqual([[ITEM.id]])
})
