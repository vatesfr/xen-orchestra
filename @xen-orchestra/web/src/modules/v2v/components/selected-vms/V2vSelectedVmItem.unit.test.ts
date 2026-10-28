import V2vSelectedVmItem from '@/modules/v2v/components/selected-vms/V2vSelectedVmItem.vue'
import type { V2vSelectedVm } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { createV2vSelectedVm } from '@/test/create-v2v-selected-vms.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { findAccentedInfos, findAccentedTags } from '@/test/find-accented-labels.ts'
import { findParts } from '@/test/find-parts.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { mount } from '@vue/test-utils'

const ITEM = createV2vSelectedVm()

async function mountItem(item: V2vSelectedVm = ITEM) {
  const router = await createV2vWizardRouter('mapping', { vm: 'another-vm' })

  return mount(V2vSelectedVmItem, { props: { item }, global: createGlobalTestConfig({ router }) })
}

it('links the name of the VM to its mapping', async () => {
  const link = (await mountItem()).getComponent(UiLink)

  expect(link.text()).toBe(ITEM.name)
  expect(link.attributes('href')).toBe(`/admin/v2v/migrate?step=mapping&vm=${ITEM.id}`)
})

it('tags the VM with its kind', async () => {
  const kind = { label: 'Resume', accent: 'info' } as const

  expect(findAccentedTags(await mountItem(createV2vSelectedVm({ kind })))).toEqual([kind])
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

it.each([
  ['selected while its mapping is shown', true],
  ['not selected otherwise', false],
])('is %s', async (_, isSelected) => {
  const wrapper = await mountItem(createV2vSelectedVm({ isSelected }))

  expect(wrapper.getComponent(UiPanelCard).props('selected')).toBe(isSelected)
})

// The router alone marks every mapping link as current: they only differ by their query
it.each([
  ['marks its link as the current page while its mapping is shown', true, 'page'],
  ['does not mark its link as the current page otherwise', false, 'false'],
])('%s', async (_, isSelected, ariaCurrent) => {
  const wrapper = await mountItem(createV2vSelectedVm({ isSelected }))

  expect(wrapper.get('a').attributes('aria-current')).toBe(ariaCurrent)
})

it('removes the VM from the list', async () => {
  const wrapper = await mountItem()

  await getButton(wrapper, t('action:remove-name-from-list', { name: ITEM.name })).trigger('click')

  expect(wrapper.emitted('remove')).toEqual([[ITEM.id]])
})
