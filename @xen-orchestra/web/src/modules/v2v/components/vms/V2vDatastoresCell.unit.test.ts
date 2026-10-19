import V2vDatastoresCell from '@/modules/v2v/components/vms/V2vDatastoresCell.vue'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

function mountCell(names: string[]) {
  return mount(V2vDatastoresCell, { props: { names }, global: createGlobalTestConfig() })
}

it('offers each datastore name, in order', () => {
  expect(
    mountCell(['ds-b', 'ds-a'])
      .findAllComponents(UiButton)
      .map(button => button.text())
  ).toEqual(['ds-b', 'ds-a'])
})

it('filters by the datastore clicked', async () => {
  const wrapper = mountCell(['ds-a', 'ds-b'])

  await getButton(wrapper, 'ds-b').trigger('click')

  expect(wrapper.emitted('filter')).toEqual([['ds-b']])
})

it('offers no datastore for a VM on none', () => {
  expect(mountCell([]).findAllComponents(UiButton)).toEqual([])
})
