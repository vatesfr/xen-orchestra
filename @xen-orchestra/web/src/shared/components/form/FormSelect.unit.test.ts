import FormSelect from '@/shared/components/form/FormSelect.vue'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountWithSetup } from '@/test/mount-with-setup.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { useFormSelect } from '@core/packages/form-select'
import { findInfoLabels } from '@core-test/find-accented-labels.ts'
import { h } from 'vue'

const WARNING = { content: 'Slow storage', accent: 'warning' } as const

function mountSelect(messages: { info?: string; error?: InputWrapperMessage; warning?: InputWrapperMessage } = {}) {
  return mountWithSetup(() => {
    const { id } = useFormSelect([{ id: 'sr-1', label: 'Local storage' }], { option: { label: 'label' } })

    return () => h(FormSelect, { id, label: 'Storage', ...messages })
  })
}

it('renders its label', () => {
  expect(findInputLabels(mountSelect())).toEqual(['Storage'])
})

it('shows no message without error nor warning', () => {
  expect(findInfoLabels(mountSelect())).toEqual([])
})

it('shows its error and its warning', () => {
  const wrapper = mountSelect({ error: dangerMessage('Storage is required.'), warning: WARNING })

  expect(findInfoLabels(wrapper).sort()).toEqual(['Slow storage', 'Storage is required.'])
})

it('shows its info beside its error and its warning', () => {
  const wrapper = mountSelect({
    info: 'Where the disks are stored.',
    error: dangerMessage('Storage is required.'),
    warning: WARNING,
  })

  expect(findInfoLabels(wrapper).sort()).toEqual([
    'Slow storage',
    'Storage is required.',
    'Where the disks are stored.',
  ])
})
