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
      repairCheckboxBindings: form.repairCheckboxBindings,
      startVmCheckboxBindings: form.startVmCheckboxBindings,
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

it('shows repairing then starting the VM after stopping its source, off and bound to the form', () => {
  const { wrapper, form } = mountCard()
  const [, repair, startVm] = findCheckboxes(wrapper)

  expect([repair, startVm]).toEqual([
    { ...pickCheckboxBindings(form.repairCheckboxBindings), modelValue: false, disabled: false },
    { ...pickCheckboxBindings(form.startVmCheckboxBindings), modelValue: false, disabled: false },
  ])
})

it('offers no other option, cleaning up the VM is not offered', () => {
  const { wrapper, form } = mountCard()

  expect(findCheckboxes(wrapper).map(({ label }) => label)).toEqual([
    form.stopSourceCheckboxBindings.label,
    form.repairCheckboxBindings.label,
    form.startVmCheckboxBindings.label,
    form.stopOnErrorCheckboxBindings.label,
  ])
  expect(findAccentedTags(wrapper)).toEqual([])
})

it('tells the tags and the Keep MAC addresses option are not applied yet', () => {
  expect(findAccentedInfos(mountCard().wrapper)).toContainEqual({
    label: t('v2v:tags-mac-not-applied'),
    accent: 'info',
  })
})

it.each([
  ['stop the source VM', 'v2v:stop-source-vm', 'stopSource', false],
  ['repair the guest', 'v2v:repair-vm', 'repair', true],
  ['start the VM', 'v2v:start-vm-on-xcp-ng', 'startVm', true],
  ['stop on error', 'stop-on-error', 'stopOnError', false],
] as const)('sets in the form whether to %s', async (_, labelKey, field, value) => {
  const { wrapper, form } = mountCard()

  await getCheckbox(wrapper, t(labelKey)).setValue(value)

  expect(form.formData[field]).toBe(value)
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
