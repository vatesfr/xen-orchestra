import FormSelect from '@/shared/components/form/FormSelect.vue'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { findInputMessages } from '@/test/find-input-messages.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { useFormSelect } from '@core/packages/form-select'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

const WARNING = { content: 'Slow storage', accent: 'warning' } as const

// A select only renders inside the component that defines it: the test mounts both together
function mountSelect(messages: { error?: InputWrapperMessage; warning?: InputWrapperMessage } = {}) {
  return mount(
    defineComponent({
      setup() {
        const { id } = useFormSelect([{ id: 'sr-1', label: 'Local storage' }], { option: { label: 'label' } })

        return () => h(FormSelect, { id, label: 'Storage', ...messages })
      },
    }),
    { global: createGlobalTestConfig() }
  )
}

it('renders its label', () => {
  expect(findInputLabels(mountSelect())).toEqual(['Storage'])
})

it('shows no message without error nor warning', () => {
  expect(findInputMessages(mountSelect())).toEqual([])
})

it('shows its error and its warning', () => {
  const wrapper = mountSelect({ error: dangerMessage('Storage is required.'), warning: WARNING })

  expect(findInputMessages(wrapper).sort()).toEqual(['Slow storage', 'Storage is required.'])
})
