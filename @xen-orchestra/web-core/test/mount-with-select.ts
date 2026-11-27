import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import type { InputAccent } from '@core/components/ui/input/UiInput.vue'
import { type FormOption, type FormSelectId, useFormSelect } from '@core/packages/form-select'
import { mountWithSetup } from '@core-test/mount-with-setup.ts'
import { h, type Ref, type VNode, type VNodeChild, type VNodeRef } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

/**
 * Renders the `VtsSelect` of the select `id`, with a `neutral` accent unless `accent` is given; `ref` and the `default`
 * option slot go to the select.
 */
export function renderSelect(
  id: FormSelectId,
  { accent = 'neutral', ref }: { accent?: InputAccent; ref?: VNodeRef } = {},
  slots: { default?: (props: { option: FormOption }) => VNodeChild } = {}
) {
  return h(VtsSelect, { id, accent, ref }, slots)
}

type SelectConfig = {
  model?: Ref<unknown>
  disabled?: boolean
  required?: boolean
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  loading?: boolean
}

type ExposedSelect = ComponentExposed<typeof VtsSelect>

/**
 * Mounts a `VtsSelect` of the `sources` (`['Option']` by default) with a `neutral` accent, attached to the document so
 * focus works. `message` puts it in a `VtsInputWrapper` showing that message; `option` renders each option instead of
 * the default `VtsOption`; `selectRef` receives the mounted select.
 */
export function mountSelect({
  sources = ['Option'],
  config,
  accent = 'neutral',
  message,
  option,
  selectRef,
}: {
  sources?: string[]
  config?: SelectConfig
  accent?: InputAccent
  message?: InputWrapperMessage
  option?: (option: FormOption) => VNode
  selectRef?: (select: ExposedSelect) => void
} = {}) {
  return mountWithSetup(
    () => {
      const { id } = useFormSelect(sources, config)

      const renderMountedSelect = () =>
        renderSelect(
          id,
          {
            accent,
            // Vue also calls a callback ref with null on unmount
            ref:
              selectRef &&
              ((instance: unknown) => {
                if (instance !== null) {
                  selectRef(instance as ExposedSelect)
                }
              }),
          },
          option ? { default: ({ option: item }) => option(item) } : {}
        )

      return () =>
        message === undefined ? renderMountedSelect() : h(VtsInputWrapper, { message }, renderMountedSelect)
    },
    { attachTo: document.body }
  )
}
