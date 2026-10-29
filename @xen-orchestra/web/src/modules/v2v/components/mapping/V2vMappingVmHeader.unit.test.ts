import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import { createV2vMappingVmHeading } from '@/test/create-v2v-mapping-vm-heading.ts'
import { findAccentedTags } from '@/test/find-accented-labels.ts'
import { findParts } from '@/test/find-parts.ts'
import { findButton, getButton, getUiButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { mount } from '@vue/test-utils'
import type { ComponentProps } from 'vue-component-type-helpers'

const HEADING = createV2vMappingVmHeading()

function mountHeader(props: Partial<ComponentProps<typeof V2vMappingVmHeader>> = {}) {
  return mount(V2vMappingVmHeader, {
    props: { heading: HEADING, action: 'remove', ...props },
    global: createGlobalTestConfig(),
  })
}

it('locates the VM on the source', () => {
  expect(findParts(mountHeader(), '.location')).toEqual(HEADING.locationParts)
})

it('names the VM', () => {
  expect(mountHeader().getComponent(UiHeadBar).get('h4').text()).toBe(HEADING.name)
})

it('tags the VM with its status', () => {
  expect(findAccentedTags(mountHeader())).toEqual([HEADING.statusTag])
})

it('has no tag without status', () => {
  expect(findAccentedTags(mountHeader({ heading: createV2vMappingVmHeading({ statusTag: undefined }) }))).toEqual([])
})

it('removes the VM from the list, without deleting anything', async () => {
  const wrapper = mountHeader()

  await getButton(wrapper, t('action:remove-from-list')).trigger('click')

  expect(wrapper.emitted('remove')).toEqual([[]])
  expect(findButton(wrapper, t('action:delete'))).toBeUndefined()
})

it('deletes the VM, as a dangerous action, without removing it from the list', async () => {
  const wrapper = mountHeader({ action: 'delete' })

  await getButton(wrapper, t('action:delete')).trigger('click')

  expect(wrapper.emitted('delete')).toEqual([[]])
  expect(getUiButton(wrapper, t('action:delete')).props('accent')).toBe('danger')
  expect(findButton(wrapper, t('action:remove-from-list'))).toBeUndefined()
})

it.each([
  ['busy while the VM is deleted', true],
  ['not busy otherwise', false],
])('shows its delete action %s', (_, busy) => {
  expect(getUiButton(mountHeader({ action: 'delete', busy }), t('action:delete')).props('busy')).toBe(busy)
})
