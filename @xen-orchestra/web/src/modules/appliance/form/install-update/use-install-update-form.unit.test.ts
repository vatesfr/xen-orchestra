import { useInstallUpdateForm } from '@/modules/appliance/form/install-update/use-install-update-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountInstallUpdateForm() {
  return mountComposable(() => useInstallUpdateForm()).wrapper.vm
}

describe('buildPayload', () => {
  it('takes a snapshot by default', () => {
    const form = mountInstallUpdateForm()

    expect(form.snapshotCheckboxBindings.modelValue).toBe(true)
    expect(form.buildPayload()).toEqual({ snapshot: true })
  })

  it('takes no snapshot once unchecked', () => {
    const form = mountInstallUpdateForm()
    form.snapshotCheckboxBindings['onUpdate:modelValue'](false)

    expect(form.buildPayload()).toEqual({ snapshot: false })
  })
})
