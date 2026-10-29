import V2vLaunchOptionsCard from '@/modules/v2v/components/review/V2vLaunchOptionsCard.vue'

import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import { findAccentedInfos, findAccentedTags } from '@/test/find-accented-labels.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mountV2vLaunchForm } from '@/test/mount-v2v-launch-form.ts'
import VtsNumberInput from '@core/components/number-input/VtsNumberInput.vue'
import { mount } from '@vue/test-utils'

function mountCard() {
  const form = mountV2vLaunchForm()

  const wrapper = mount(V2vLaunchOptionsCard, {
    props: {
      stopSourceCheckboxBindings: form.stopSourceCheckboxBindings,
      stopOnErrorCheckboxBindings: form.stopOnErrorCheckboxBindings,
      concurrencyInputBindings: form.concurrencyInputBindings,
    },
    global: createGlobalTestConfig(),
  })

  return { wrapper, form }
}

function pickCheckboxBindings({ label, info, modelValue }: { label: string; info?: string; modelValue: boolean }) {
  return { label, info, modelValue }
}

function findCheckboxes(wrapper: ReturnType<typeof mountCard>['wrapper']) {
  return wrapper.findAllComponents(FormCheckbox).map(checkbox => {
    const { label, info, modelValue, disabled } = checkbox.props()

    return { label, info, modelValue, disabled }
  })
}

it('shows its title and that the options apply to every VM unless overridden', () => {
  expect(findCardTitle(mountCard().wrapper)).toBe(`${t('default-options')} ${t('v2v:default-options-info')}`)
})

it('shows stopping the source VM first and stopping on error last, bound to the form', () => {
  const { wrapper, form } = mountCard()
  const [stopSource, , , stopOnError] = findCheckboxes(wrapper)

  expect([stopSource, stopOnError]).toEqual([
    { ...pickCheckboxBindings(form.stopSourceCheckboxBindings), disabled: false },
    { ...pickCheckboxBindings(form.stopOnErrorCheckboxBindings), disabled: false },
  ])
})

it('shows starting then cleaning up the VM in between, off and disabled, as not supported yet', () => {
  const [, startVm, cleanup] = findCheckboxes(mountCard().wrapper)

  expect([startVm, cleanup]).toEqual([
    { label: t('v2v:start-vm-on-xcp-ng'), info: t('not-supported-yet'), modelValue: false, disabled: true },
    { label: t('v2v:clean-up-vm'), info: t('not-supported-yet'), modelValue: false, disabled: true },
  ])
})

it('tags cleaning up the VM as a preview', () => {
  expect(findAccentedTags(mountCard().wrapper)).toEqual([{ label: t('preview'), accent: 'warning' }])
})

it('tells the tags and the Keep MAC addresses option are not applied yet', () => {
  expect(findAccentedInfos(mountCard().wrapper)).toContainEqual({
    label: t('v2v:tags-mac-not-applied'),
    accent: 'info',
  })
})

it.each([
  ['stop the source VM', 'v2v:stop-source-vm', 'stopSource'],
  ['stop on error', 'stop-on-error', 'stopOnError'],
] as const)('sets in the form whether to %s', async (_, labelKey, field) => {
  const { wrapper, form } = mountCard()

  await getCheckbox(wrapper, t(labelKey)).setValue(false)

  expect(form.formData[field]).toBe(false)
})

it('shows the concurrency input of the form', () => {
  const { wrapper, form } = mountCard()
  const { label, modelValue, required } = form.concurrencyInputBindings

  expect(wrapper.getComponent(VtsNumberInput).props()).toMatchObject({ label, modelValue, required })
})

it('sets the concurrency in the form', async () => {
  const { wrapper, form } = mountCard()

  await wrapper.getComponent(VtsNumberInput).get('input').setValue('4')

  expect(form.formData.concurrency).toBe(4)
})
