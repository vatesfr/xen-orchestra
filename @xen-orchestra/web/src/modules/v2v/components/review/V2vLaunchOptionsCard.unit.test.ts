import V2vLaunchOptionsCard from '@/modules/v2v/components/review/V2vLaunchOptionsCard.vue'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import { findCardTitle } from '@/test/find-titles.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mountV2vLaunchForm } from '@/test/mount-v2v-launch-form.ts'
import VtsNumberInput from '@core/components/number-input/VtsNumberInput.vue'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

function mountCard() {
  const form = mountV2vLaunchForm()

  const wrapper = mount(V2vLaunchOptionsCard, {
    props: {
      stopSourceCheckboxBindings: form.stopSourceCheckboxBindings,
      dockingCheckboxBindings: form.dockingCheckboxBindings,
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

it('shows stopping the source VM, docking the guest, starting the VM then stopping on error, bound to the form', () => {
  const { wrapper, form } = mountCard()
  expect(findCheckboxes(wrapper)).toEqual([
    { ...pickCheckboxBindings(form.stopSourceCheckboxBindings), disabled: false },
    { ...pickCheckboxBindings(form.dockingCheckboxBindings), disabled: false },
    { ...pickCheckboxBindings(form.startVmCheckboxBindings), disabled: false },
    { ...pickCheckboxBindings(form.stopOnErrorCheckboxBindings), disabled: false },
  ])
})

it('tells the tags and the Keep MAC addresses option are not applied yet', () => {
  expect(findAccentedInfos(mountCard().wrapper)).toContainEqual({
    label: t('v2v:tags-mac-not-applied'),
    accent: 'info',
  })
})

it.each([
  ['stop the source VM', 'v2v:stop-source-vm', 'stopSource'],
  ['dock the guest', 'v2v:docking-vm', 'docking'],
  ['start the VM', 'v2v:start-vm-on-xcp-ng', 'startVm'],
  ['stop on error', 'stop-on-error', 'stopOnError'],
] as const)('sets in the form whether to %s', async (_, labelKey, field) => {
  const { wrapper, form } = mountCard()
  const value = !form.formData[field]

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
