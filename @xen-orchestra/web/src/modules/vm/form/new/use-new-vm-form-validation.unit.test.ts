import { type NewVmUndersizedVdi, useNewVmFormValidation } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import type { Vdi, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { createNewVmState, NEW_VM_ISO, NEW_VM_SR } from '@/test/new-vm-fixtures.ts'
import { nextTick, reactive } from 'vue'

const NEW_VDI: Vdi = { key: 'new-vdi', name_label: 'New disk', name_description: '', size: 1, sr: NEW_VM_SR.id }

const UNDERSIZED_VDI: NewVmUndersizedVdi = { key: 'vdi-template', name: 'Template disk', minSize: 10 }

function mountValidation(overrides: Partial<VmState> = {}, undersizedVdis: NewVmUndersizedVdi[] = []) {
  return mountComposableWithI18n(() => {
    const vmState = reactive(createNewVmState(overrides))

    return { vmState, ...useNewVmFormValidation(vmState, undersizedVdis) }
  })
}

describe('errors', () => {
  it('shows nothing before a step is validated', () => {
    const validation = mountValidation({ pool: undefined, new_vm_template: undefined, name: '' })

    expect(validation.errors).toEqual({})
  })

  it('requires the pool and the template once the environment step is validated', async () => {
    const validation = mountValidation({ pool: undefined, new_vm_template: undefined, name: '' })

    await validation.validateStep('environment')

    expect(validation.errors).toEqual({
      pool: validation.t('form:error:required'),
      template: validation.t('form:error:required'),
    })
  })

  it('requires the name once the configuration step is validated', async () => {
    const validation = mountValidation({ name: '' })

    await validation.validateStep('configuration')

    expect(validation.errors.name).toBe(validation.t('form:error:required'))
  })

  it('requires an ISO when installing from one', async () => {
    const validation = mountValidation({ installMode: 'cdrom', selectedVdi: undefined })

    await validation.validateStep('configuration')

    expect(validation.errors.iso).toBe(validation.t('form:error:required'))
  })

  it('requires no ISO for another installation source', async () => {
    const validation = mountValidation({ installMode: 'network', selectedVdi: undefined })

    await validation.validateStep('configuration')

    expect(validation.errors.iso).toBeUndefined()
  })

  it('requires an SR on every new disk', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, sr: undefined }] })

    await validation.validateStep('configuration')

    expect(validation.errors.vdis).toBe(validation.t('job:arg:sr-vdi-required'))
  })

  it('requires every new disk to be at least 1 GB', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, size: 0 }] })

    await validation.validateStep('configuration')

    expect(validation.errors.vdis).toBe(
      validation.t('form:error:field-minimum', { field: validation.t('size'), min: 1 })
    )
  })

  it('forgets the error of a disk as soon as it is fixed', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, size: 0 }] })
    await validation.validateStep('configuration')

    validation.vmState.vdis[0].size = 5
    await nextTick()

    expect(validation.errors.vdis).toBeUndefined()
    expect(validation.invalidVdiFields).toEqual([])
  })

  it('leaves a disk added since the last validation alone until the next one', async () => {
    const validation = mountValidation({ vdis: [NEW_VDI] })
    await validation.validateStep('configuration')

    validation.vmState.vdis.push({ ...NEW_VDI, key: 'new-vdi-added', size: 0 })
    await nextTick()

    expect(validation.errors.vdis).toBeUndefined()
    expect(validation.invalidVdiFields).toEqual([])

    await validation.validateStep('configuration')

    expect(validation.invalidVdiFields).toEqual([{ key: 'new-vdi-added', field: 'size' }])
  })

  it('hides the errors of a step again once it is reset', async () => {
    const validation = mountValidation({ name: '' })

    await validation.validateStep('configuration')
    validation.resetStep('configuration')

    expect(validation.errors).toEqual({})
  })
})

describe('errorMessages', () => {
  it('hands each error to its input as a danger message', async () => {
    const validation = mountValidation({ name: '' })

    await validation.validateStep('configuration')

    expect(validation.errorMessages.name).toEqual({ content: validation.t('form:error:required'), accent: 'danger' })
  })

  it('has no message for a valid field', async () => {
    const validation = mountValidation()

    await validation.validateStep('configuration')

    expect(validation.errorMessages.name).toBeUndefined()
  })
})

describe('vdiSizeErrors', () => {
  it('tells each disk smaller than its template disk, before the step is validated', () => {
    const validation = mountValidation({}, [UNDERSIZED_VDI])

    expect(validation.vdiSizeErrors).toEqual([
      {
        key: UNDERSIZED_VDI.key,
        message: validation.t('new-vm:disk-size-below-template', { name: 'Template disk', size: 10 }),
      },
    ])
  })

  it('is empty while every disk is large enough', () => {
    expect(mountValidation().vdiSizeErrors).toEqual([])
  })
})

describe('invalidVdiFields', () => {
  it('lists the size of a template disk made too small, before the step is validated', () => {
    const validation = mountValidation({}, [UNDERSIZED_VDI])

    expect(validation.invalidVdiFields).toEqual([{ key: UNDERSIZED_VDI.key, field: 'size' }])
  })

  it('leaves the fields of a new disk alone until the step is validated', () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, sr: undefined, size: 0 }] })

    expect(validation.invalidVdiFields).toEqual([])
  })

  it('lists the missing SR and the size below 1 GB of each new disk once the step is validated', async () => {
    const validation = mountValidation({
      vdis: [
        NEW_VDI,
        { ...NEW_VDI, key: 'new-vdi-without-sr', sr: undefined },
        { ...NEW_VDI, key: 'new-vdi-empty', size: 0 },
      ],
    })

    await validation.validateStep('configuration')

    expect(validation.invalidVdiFields).toEqual([
      { key: 'new-vdi-without-sr', field: 'sr' },
      { key: 'new-vdi-empty', field: 'size' },
    ])
  })
})

describe('validateStep', () => {
  it('accepts the environment step with a pool and a template', async () => {
    expect(await mountValidation().validateStep('environment')).toBe(true)
  })

  it('refuses the environment step without a template', async () => {
    expect(await mountValidation({ new_vm_template: undefined }).validateStep('environment')).toBe(false)
  })

  it('accepts a complete configuration step', async () => {
    const validation = mountValidation({ installMode: 'cdrom', selectedVdi: NEW_VM_ISO.id, vdis: [NEW_VDI] })

    expect(await validation.validateStep('configuration')).toBe(true)
  })

  it('refuses the configuration step without a name', async () => {
    expect(await mountValidation({ name: '' }).validateStep('configuration')).toBe(false)
  })

  it('refuses the configuration step while a disk is smaller than its template disk', async () => {
    expect(await mountValidation({}, [UNDERSIZED_VDI]).validateStep('configuration')).toBe(false)
  })

  it('leaves the environment step valid while a disk is smaller than its template disk', async () => {
    expect(await mountValidation({}, [UNDERSIZED_VDI]).validateStep('environment')).toBe(true)
  })
})

describe('focusFirstError', () => {
  it('focuses the first field in error, in the order the fields are laid out', async () => {
    const validation = mountValidation({ name: '', installMode: 'cdrom', selectedVdi: undefined })
    const { name, iso } = validation.fieldIds
    document.body.innerHTML = `<div id="${iso}"><input /></div><div id="${name}"><input /></div>`

    await validation.validateStep('configuration')
    await validation.focusFirstError()

    expect(document.activeElement).toBe(document.getElementById(iso)?.querySelector('input'))
  })

  it('focuses the field the table of the disks marks as its first one in error', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, size: 0 }] })
    document.body.innerHTML = `<input /><input id="${validation.fieldIds.vdis}" />`

    await validation.validateStep('configuration')
    await validation.focusFirstError()

    expect(document.activeElement).toBe(document.getElementById(validation.fieldIds.vdis))
  })

  it('focuses nothing while no error is shown', async () => {
    const validation = mountValidation({ name: '' })
    document.body.innerHTML = `<div id="${validation.fieldIds.name}"><input /></div>`

    await validation.focusFirstError()

    expect(document.activeElement).toBe(document.body)
  })
})
