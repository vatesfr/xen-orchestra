import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useNewSrForm } from '@/modules/storage-repository/form/new/use-new-sr-form.ts'
import type { NewSrType } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool, DISKOR_POOL_NAME, OTHER_POOL_ID, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { mountWithSetupResult } from '@/test/mount-with-setup.ts'
import type { FormSelectId } from '@core/packages/form-select'
import { OVERLAY_ABORT_EVENT } from '@core/packages/overlay/symbols.ts'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'
import { renderSelect } from '@core-test/mount-with-select.ts'
import { chooseSelectOption } from '@core-test/select.ts'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

mockXoCollections('pool', 'host')
mockOverlay()

const POOL = createPool()

const MASTER = createHost({ id: POOL.master })

const SLAVE = createHost({ id: 'host-slave' as FrontXoHost['id'], name_label: 'Slave host' })

const OTHER_POOL = createPool({
  id: OTHER_POOL_ID,
  name_label: DISKOR_POOL_NAME,
  master: 'host-other-master' as FrontXoPool['master'],
})

const OTHER_MASTER = createHost({ id: OTHER_POOL.master, $pool: OTHER_POOL_ID })

function seedPools() {
  xoCollectionsMock.pools.value = [POOL, OTHER_POOL]
  xoCollectionsMock.hosts.value = [MASTER, SLAVE, OTHER_MASTER]
}

beforeEach(() => {
  xoCollectionsMock.reset()
  overlayMock.reset()
  seedPools()
})

// The modal asking to erase the device of an ext or LVM SR: the form opens it on submit, closed with `event`
function answerEraseConfirm(event: 'onConfirm' | 'onCancel' | typeof OVERLAY_ABORT_EVENT) {
  overlayMock.getOverlay().open.mockResolvedValue({ event, payload: undefined })
}

// The Storage tab of a pool opens the drawer without host, the one of a host with that host
function mountNewSrForm({ poolId = POOL.id, hostId }: { poolId?: FrontXoPool['id']; hostId?: FrontXoHost['id'] } = {}) {
  const form = mountComposableWithI18n(() => useNewSrForm(poolId, hostId))
  answerEraseConfirm('onConfirm')

  return form
}

type NewSrForm = ReturnType<typeof mountNewSrForm>

type UnwrappedNewSrForm = Pick<
  NewSrForm,
  'nameInputBindings' | 'deviceInputBindings' | 'serverInputBindings' | 'pathInputBindings'
> & {
  type: NewSrType | undefined
}

async function chooseType(form: Pick<UnwrappedNewSrForm, 'type'>, type: NewSrType) {
  form.type = type
  await nextTick()
}

const LOCATIONS = {
  ext: { field: 'deviceInputBindings', value: '/dev/sdb' },
  lvm: { field: 'deviceInputBindings', value: '/dev/sdb' },
  smb: { field: 'serverInputBindings', value: 'nas' },
  smbiso: { field: 'serverInputBindings', value: 'nas' },
  local: { field: 'pathInputBindings', value: '/test/iso' },
} as const satisfies Record<NewSrType, { field: keyof UnwrappedNewSrForm; value: string }>

// The minimal valid form of an SR of `type`: its name and the location field of its type
async function fillSr(form: UnwrappedNewSrForm, type: NewSrType) {
  const { field, value } = LOCATIONS[type]

  form.nameInputBindings['onUpdate:modelValue']('My SR')
  await chooseType(form, type)
  form[field]['onUpdate:modelValue'](value)
}

// A local SR (ext) or a shared one (SMB)
function fillLocalSr(form: UnwrappedNewSrForm) {
  return fillSr(form, 'ext')
}

function fillSharedSr(form: UnwrappedNewSrForm) {
  return fillSr(form, 'smb')
}

// A select only reacts once rendered: renders the one of `getSelectId`
function mountNewSrFormSelect(
  getSelectId: (form: ReturnType<typeof useNewSrForm>) => FormSelectId,
  hostId?: FrontXoHost['id']
) {
  const { wrapper, result: form } = mountWithSetupResult(() => {
    const form = useNewSrForm(POOL.id, hostId)

    return { result: form, render: () => renderSelect(getSelectId(form)) }
  })

  answerEraseConfirm('onConfirm')

  // The tests read and write the form as a mounted component exposes it: refs unwrapped

  const unwrappedForm: UnwrappedNewSrForm & Pick<ReturnType<typeof useNewSrForm>, 'submit'> = {
    get nameInputBindings() {
      return form.nameInputBindings.value
    },
    get deviceInputBindings() {
      return form.deviceInputBindings.value
    },
    get serverInputBindings() {
      return form.serverInputBindings.value
    },
    get pathInputBindings() {
      return form.pathInputBindings.value
    },
    get type() {
      return form.type.value
    },
    set type(type) {
      form.type.value = type
    },
    submit: form.submit,
  }

  return { wrapper, form: unwrappedForm, rawForm: form }
}

describe('accessModeInputBindings', () => {
  it('starts in shared access mode on a pool', () => {
    expect(mountNewSrForm().accessModeInputBindings.modelValue).toBe(SR_ACCESS_MODE.SHARED)
  })

  it('starts in local access mode on a host', () => {
    expect(mountNewSrForm({ hostId: SLAVE.id }).accessModeInputBindings.modelValue).toBe(SR_ACCESS_MODE.LOCAL)
  })

  it('starts the type and its fields from scratch when the access mode changes', async () => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await fillLocalSr(form)

    form.accessModeInputBindings['onUpdate:modelValue'](SR_ACCESS_MODE.SHARED)
    await nextTick()

    expect(form.type).toBeUndefined()
    expect(form.deviceInputBindings.modelValue).toBe('')
  })
})

describe('submit', () => {
  it('creates a shared SR on the master of the pool', async () => {
    const form = mountNewSrForm()
    await fillSharedSr(form)

    expect(await form.submit()).toMatchObject({
      hostId: MASTER.id,
      name_label: 'My SR',
      SR_type: 'smb',
    })
  })

  it('creates a local SR on the host it was opened from', async () => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await fillLocalSr(form)

    expect(await form.submit()).toMatchObject({ hostId: SLAVE.id, SR_type: 'ext' })
  })

  it('creates a shared SR on the master of the pool once switched from a host', async () => {
    const form = mountNewSrForm({ hostId: SLAVE.id })

    form.accessModeInputBindings['onUpdate:modelValue'](SR_ACCESS_MODE.SHARED)
    await nextTick()
    await fillSharedSr(form)

    expect(await form.submit()).toMatchObject({ hostId: MASTER.id })
  })

  it('selects the pool and its master once the pools are loaded', async () => {
    xoCollectionsMock.startLoadingPools()
    const form = mountNewSrForm()

    seedPools()
    await nextTick()
    await fillSharedSr(form)

    expect(await form.submit()).toMatchObject({ hostId: MASTER.id })
  })

  it('requires the name and the type', async () => {
    const form = mountNewSrForm()

    expect(await form.submit()).toBeUndefined()
    expect(form.nameInputBindings.error).toEqual(requiredMessage())
    expect(form.typeSelectBindings.error).toEqual(requiredMessage())
  })

  it('requires the pool when the one it was opened from is unknown', async () => {
    const form = mountNewSrForm({ poolId: UNKNOWN_POOL_ID })
    await fillSharedSr(form)

    expect(await form.submit()).toBeUndefined()
    expect(form.poolSelectBindings.error).toEqual(dangerMessage(form.t('pool-required')))
  })

  it.each([
    { type: 'ext', required: 'deviceInputBindings', notRequired: 'serverInputBindings' },
    { type: 'smb', required: 'serverInputBindings', notRequired: 'deviceInputBindings' },
    { type: 'local', required: 'pathInputBindings', notRequired: 'deviceInputBindings' },
  ] as const)('requires only the location field of a $type SR', async ({ type, required, notRequired }) => {
    const form = mountNewSrForm({ hostId: type === 'smb' ? undefined : SLAVE.id })
    form.nameInputBindings['onUpdate:modelValue']('My SR')
    await chooseType(form, type)

    expect(await form.submit()).toBeUndefined()
    expect(form[required].error).toEqual(requiredMessage())
    expect(form[notRequired].error).toBeUndefined()
  })

  it.each([
    { mode: 'local', hostId: SLAVE.id, fill: fillLocalSr },
    { mode: 'shared', hostId: undefined, fill: fillSharedSr },
  ])('creates the SR on the master of a pool chosen in $mode access mode', async ({ hostId, fill }) => {
    const { wrapper, form } = mountNewSrFormSelect(form => form.poolSelectBindings.value.id, hostId)
    await flushPromises()

    await chooseSelectOption(wrapper, DISKOR_POOL_NAME)
    await fill(form)

    expect(await form.submit()).toMatchObject({ hostId: OTHER_MASTER.id })
  })

  it('drops the preferred image formats of a type that does not take them', async () => {
    const { wrapper, form } = mountNewSrFormSelect(form => form.preferredImageFormatsSelectBindings.value.id, SLAVE.id)
    await fillLocalSr(form)
    await chooseSelectOption(wrapper, 'qcow2')

    await chooseType(form, 'local')
    await chooseType(form, 'ext')

    expect((await form.submit())?.device_config).not.toHaveProperty('preferred-image-formats')
  })
})

describe('preferredImageFormatsSelectBindings', () => {
  it('warns that a format with qcow2 needs qcow2 support on the host', async () => {
    const { wrapper, rawForm } = mountNewSrFormSelect(
      form => form.preferredImageFormatsSelectBindings.value.id,
      SLAVE.id
    )

    await chooseSelectOption(wrapper, 'vhd, qcow2')

    expect(rawForm.preferredImageFormatsSelectBindings.value.warning).toEqual({
      content: t('sr-preferred-image-formats-qcow2-warning'),
      accent: 'warning',
    })
  })

  it('does not warn for VHD alone', async () => {
    const { wrapper, rawForm } = mountNewSrFormSelect(
      form => form.preferredImageFormatsSelectBindings.value.id,
      SLAVE.id
    )

    await chooseSelectOption(wrapper, 'vhd')

    expect(rawForm.preferredImageFormatsSelectBindings.value.warning).toBeUndefined()
  })
})

describe('submit with an erase confirmation', () => {
  it('does not ask to erase a device when the form is invalid', async () => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await chooseType(form, 'ext')

    expect(await form.submit()).toBeUndefined()
    expect(overlayMock.getOverlay().open).not.toHaveBeenCalled()
  })

  it.each([
    { type: 'local', hostId: SLAVE.id, srType: 'iso' },
    { type: 'smb', hostId: undefined, srType: 'smb' },
    { type: 'smbiso', hostId: undefined, srType: 'iso' },
  ] as const)('creates a $type SR without asking to erase a device', async ({ type, hostId, srType }) => {
    const form = mountNewSrForm({ hostId })
    await fillSr(form, type)

    expect(await form.submit()).toMatchObject({ SR_type: srType })
    expect(overlayMock.getOverlay().open).not.toHaveBeenCalled()
  })

  it.each(['ext', 'lvm'] as const)('asks to erase the device of a %s SR', async type => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await fillSr(form, type)

    await form.submit()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: { device: '/dev/sdb' } })
  })

  it.each(['ext', 'lvm'] as const)('creates the %s SR once the erase is confirmed', async type => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await fillSr(form, type)

    expect(await form.submit()).toMatchObject({ SR_type: type, device_config: { device: '/dev/sdb' } })
  })

  it.each([
    { type: 'ext', event: 'onCancel', answer: 'go back' },
    { type: 'lvm', event: 'onCancel', answer: 'go back' },
    { type: 'ext', event: OVERLAY_ABORT_EVENT, answer: 'closed' },
    { type: 'lvm', event: OVERLAY_ABORT_EVENT, answer: 'closed' },
  ] as const)('does not create the $type SR when the erase modal is $answer', async ({ type, event }) => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await fillSr(form, type)
    answerEraseConfirm(event)

    expect(await form.submit()).toBeUndefined()
  })
})

describe('supportsPreferredImageFormats', () => {
  it.each([
    { type: 'smb', expected: true },
    { type: 'smbiso', expected: false },
  ] as const)('is $expected for a $type SR', async ({ type, expected }) => {
    const form = mountNewSrForm()
    await chooseType(form, type)

    expect(form.supportsPreferredImageFormats).toBe(expected)
  })
})
