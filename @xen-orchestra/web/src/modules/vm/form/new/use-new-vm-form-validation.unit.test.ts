import { type NewVmUndersizedVdi, useNewVmFormValidation } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import type { Vdi, Vif, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { createNewVmState, NEW_VM_ISO, NEW_VM_NETWORK, NEW_VM_SR } from '@/test/new-vm-fixtures.ts'
import { type MaybeRefOrGetter, nextTick, reactive, ref } from 'vue'

const NEW_VDI: Vdi = { key: 'new-vdi', name_label: 'New disk', name_description: '', size: 1, sr: NEW_VM_SR.id }

const VIF: Vif = { key: 'vif', network: NEW_VM_NETWORK.id, mac: '' }

const UNDERSIZED_VDI: NewVmUndersizedVdi = { key: 'vdi-template', minSize: 10 }

const UNDERSIZED_TEMPLATE_VDI: Vdi = { ...NEW_VDI, key: UNDERSIZED_VDI.key, size: 5 }

function mountValidation(
  overrides: Partial<VmState> = {},
  undersizedVdis: MaybeRefOrGetter<NewVmUndersizedVdi[]> = []
) {
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

describe('vifsValidation.issues', () => {
  it('lists nothing before the configuration step is validated', () => {
    expect(mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }] }).vifsValidation.issues.size).toBe(0)
  })

  it('lists the missing network and the invalid MAC address of each network interface', async () => {
    const validation = mountValidation({
      vifs: [VIF, { ...VIF, key: 'vif-invalid', network: '' as Vif['network'], mac: 'not-a-mac' }],
    })

    await validation.validateStep('configuration')

    expect(validation.vifsValidation.issues).toEqual(
      new Map([
        [
          'vif-invalid',
          [
            { field: 'network', message: validation.t('new-vm:network-mandatory') },
            { field: 'mac', message: validation.t('new-vm:mac-address-invalid') },
          ],
        ],
      ])
    )
  })

  it.each(['', '00:16:3e:12:34:56', '00-16-3E-12-34-56'])('accepts the MAC address "%s"', async mac => {
    const validation = mountValidation({ vifs: [{ ...VIF, mac }] })

    await validation.validateStep('configuration')

    expect(validation.vifsValidation.issues.size).toBe(0)
  })

  it('checks a network interface added since the configuration step was validated', async () => {
    const validation = mountValidation({ vifs: [VIF] })
    await validation.validateStep('configuration')

    validation.vmState.vifs.push({ ...VIF, key: 'vif-added', mac: 'not-a-mac' })
    await nextTick()

    expect([...validation.vifsValidation.issues.keys()]).toEqual(['vif-added'])
  })

  it('lists nothing again once the configuration step is reset', async () => {
    const validation = mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }] })
    await validation.validateStep('configuration')

    validation.resetStep('configuration')

    expect(validation.vifsValidation.issues.size).toBe(0)
  })

  it('forgets the issue of a network interface as soon as it is fixed', async () => {
    const validation = mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }] })
    await validation.validateStep('configuration')

    validation.vmState.vifs[0].mac = '00:16:3e:12:34:56'
    await nextTick()

    expect(validation.vifsValidation.issues.size).toBe(0)
  })

  it('forgets a network interface once it is removed', async () => {
    const validation = mountValidation({ vifs: [VIF, { ...VIF, key: 'vif-invalid', mac: 'not-a-mac' }] })
    await validation.validateStep('configuration')

    validation.vmState.vifs = validation.vmState.vifs.filter(vif => vif.key !== 'vif-invalid')
    await nextTick()

    expect(validation.vifsValidation.issues.size).toBe(0)
  })

  it('lists nothing when only the environment step is validated', async () => {
    const validation = mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }] })

    await validation.validateStep('environment')

    expect(validation.vifsValidation.issues.size).toBe(0)
  })

  it('keeps listing the network interfaces once the environment step is reset', async () => {
    const validation = mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }] })
    await validation.validateStep('configuration')

    validation.resetStep('environment')

    expect([...validation.vifsValidation.issues.keys()]).toEqual([VIF.key])
  })
})

describe('vdisValidation.issues', () => {
  it('tells a template disk made too small at once', () => {
    const validation = mountValidation({ existingVdis: [UNDERSIZED_TEMPLATE_VDI] }, [UNDERSIZED_VDI])

    expect(validation.vdisValidation.issues).toEqual(
      new Map([
        [
          UNDERSIZED_VDI.key,
          [{ field: 'size', message: validation.t('new-vm:size-below-template', { size: UNDERSIZED_VDI.minSize }) }],
        ],
      ])
    )
  })

  it('leaves the fields of a new disk alone until the configuration step is validated', () => {
    expect(mountValidation({ vdis: [{ ...NEW_VDI, sr: undefined, size: 0 }] }).vdisValidation.issues.size).toBe(0)
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

    expect(validation.vdisValidation.issues).toEqual(
      new Map([
        ['new-vdi-without-sr', [{ field: 'sr', message: validation.t('new-vm:sr-mandatory') }]],
        ['new-vdi-empty', [{ field: 'size', message: validation.t('new-vm:size-minimum', { min: 1 }) }]],
      ])
    )
  })

  it('leaves a disk added since the last validation alone until the next one', async () => {
    const validation = mountValidation({ vdis: [NEW_VDI] })
    await validation.validateStep('configuration')

    validation.vmState.vdis.push({ ...NEW_VDI, key: 'new-vdi-added', size: 0 })
    await nextTick()

    expect(validation.vdisValidation.issues.size).toBe(0)

    await validation.validateStep('configuration')

    expect([...validation.vdisValidation.issues.keys()]).toEqual(['new-vdi-added'])
  })

  it('leaves the new disks alone again once the configuration step is reset', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, size: 0 }] })
    await validation.validateStep('configuration')

    validation.resetStep('configuration')

    expect(validation.vdisValidation.issues.size).toBe(0)
  })

  it('forgets the issue of a disk as soon as it is fixed', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, size: 0 }] })
    await validation.validateStep('configuration')

    validation.vmState.vdis[0].size = 5
    await nextTick()

    expect(validation.vdisValidation.issues.size).toBe(0)
  })

  it('leaves the new disks alone when only the environment step is validated', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI, sr: undefined }] })

    await validation.validateStep('environment')

    expect(validation.vdisValidation.issues.size).toBe(0)
  })

  it('tells a disk validated with an SR as soon as its SR is cleared', async () => {
    const validation = mountValidation({ vdis: [{ ...NEW_VDI }] })
    await validation.validateStep('configuration')

    validation.vmState.vdis[0].sr = undefined
    await nextTick()

    expect(validation.vdisValidation.issues).toEqual(
      new Map([[NEW_VDI.key, [{ field: 'sr', message: validation.t('new-vm:sr-mandatory') }]]])
    )
  })

  it('tells a template disk emptied only that it is smaller than in its template', async () => {
    const validation = mountValidation({ existingVdis: [{ ...UNDERSIZED_TEMPLATE_VDI, size: 0 }] }, [UNDERSIZED_VDI])

    await validation.validateStep('configuration')

    expect(validation.vdisValidation.issues).toEqual(
      new Map([
        [
          UNDERSIZED_VDI.key,
          [{ field: 'size', message: validation.t('new-vm:size-below-template', { size: UNDERSIZED_VDI.minSize }) }],
        ],
      ])
    )
  })

  it('keeps telling a template disk made too small once the configuration step is reset', async () => {
    const validation = mountValidation({ existingVdis: [UNDERSIZED_TEMPLATE_VDI] }, [UNDERSIZED_VDI])
    await validation.validateStep('configuration')

    validation.resetStep('configuration')

    expect([...validation.vdisValidation.issues.keys()]).toEqual([UNDERSIZED_VDI.key])
  })

  it('forgets a template disk once it is no longer too small', async () => {
    const undersizedVdis = ref([UNDERSIZED_VDI])
    const validation = mountValidation({ existingVdis: [UNDERSIZED_TEMPLATE_VDI] }, undersizedVdis)

    undersizedVdis.value = []
    await nextTick()

    expect(validation.vdisValidation.issues.size).toBe(0)
  })
})

describe('warned rows', () => {
  const vifs = (count: number) => Array.from({ length: count }, (_, index) => ({ ...VIF, key: `vif-${index}` }))
  const vdis = (count: number) => Array.from({ length: count }, (_, index) => ({ ...NEW_VDI, key: `vdi-${index}` }))

  it('warns about nothing up to 8 network interfaces and 8 disks', () => {
    const validation = mountValidation({ vifs: vifs(8), vdis: vdis(8) })

    expect(validation.vifsValidation.warnedKeys.size).toBe(0)
    expect(validation.vifsValidation.warning).toBeUndefined()
    expect(validation.vdisValidation.warnedKeys.size).toBe(0)
    expect(validation.vdisValidation.warning).toBeUndefined()
  })

  it('warns about the network interfaces past the 8th', () => {
    const validation = mountValidation({ vifs: vifs(10) })

    expect([...validation.vifsValidation.warnedKeys]).toEqual(['vif-8', 'vif-9'])
    expect(validation.vifsValidation.warning).toBe(validation.t('new-vm:too-many-vifs', { n: 8 }))
  })

  it('warns about the disks past the 8th, the template disks counted first', () => {
    const validation = mountValidation({
      existingVdis: vdis(2).map(vdi => ({ ...vdi, key: `template-${vdi.key}` })),
      vdis: vdis(7),
    })

    expect([...validation.vdisValidation.warnedKeys]).toEqual(['vdi-6'])
    expect(validation.vdisValidation.warning).toBe(validation.t('new-vm:too-many-vdis', { n: 8 }))
  })

  it('stops warning once the network interfaces and the disks are back to 8', async () => {
    const validation = mountValidation({ vifs: vifs(9), vdis: vdis(9) })

    validation.vmState.vifs.pop()
    validation.vmState.vdis.shift()
    await nextTick()

    expect(validation.vifsValidation.warnedKeys.size).toBe(0)
    expect(validation.vifsValidation.warning).toBeUndefined()
    expect(validation.vdisValidation.warnedKeys.size).toBe(0)
    expect(validation.vdisValidation.warning).toBeUndefined()
  })

  it('leaves the configuration step valid past 8 network interfaces and disks', async () => {
    expect(await mountValidation({ vifs: vifs(9), vdis: vdis(9) }).validateStep('configuration')).toBe(true)
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

  it('refuses the configuration step while a network interface has an invalid MAC address', async () => {
    expect(await mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }] }).validateStep('configuration')).toBe(false)
  })

  it('refuses the configuration step while a new disk has no SR', async () => {
    expect(await mountValidation({ vdis: [{ ...NEW_VDI, sr: undefined }] }).validateStep('configuration')).toBe(false)
  })

  it('refuses the configuration step with a network interface made invalid once the step was reset', async () => {
    const validation = mountValidation({ vifs: [{ ...VIF }] })
    validation.resetStep('configuration')

    validation.vmState.vifs[0].mac = 'not-a-mac'
    await nextTick()

    expect(await validation.validateStep('configuration')).toBe(false)
  })

  it('refuses the configuration step with an empty new disk once the disks were replaced', async () => {
    const validation = mountValidation()

    validation.vmState.vdis = [{ ...NEW_VDI, size: 0 }]
    await nextTick()

    expect(await validation.validateStep('configuration')).toBe(false)
  })

  it('refuses the configuration step while a disk is smaller than its template disk', async () => {
    expect(
      await mountValidation({ existingVdis: [UNDERSIZED_TEMPLATE_VDI] }, [UNDERSIZED_VDI]).validateStep('configuration')
    ).toBe(false)
  })

  it('leaves the environment step valid while a disk is smaller than its template disk', async () => {
    expect(
      await mountValidation({ existingVdis: [UNDERSIZED_TEMPLATE_VDI] }, [UNDERSIZED_VDI]).validateStep('environment')
    ).toBe(true)
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

  it('focuses the network interfaces before the disks', async () => {
    const validation = mountValidation({ vifs: [{ ...VIF, mac: 'not-a-mac' }], vdis: [{ ...NEW_VDI, size: 0 }] })
    const { vifs, vdis } = validation.fieldIds
    document.body.innerHTML = `<input id="${vdis}" /><input id="${vifs}" />`

    await validation.validateStep('configuration')
    await validation.focusFirstError()

    expect(document.activeElement).toBe(document.getElementById(vifs))
  })

  it('focuses nothing while no error is shown', async () => {
    const validation = mountValidation({ name: '' })
    document.body.innerHTML = `<div id="${validation.fieldIds.name}"><input /></div>`

    await validation.focusFirstError()

    expect(document.activeElement).toBe(document.body)
  })
})
