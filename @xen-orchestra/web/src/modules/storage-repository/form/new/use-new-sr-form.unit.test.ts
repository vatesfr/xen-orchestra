import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useNewSrForm } from '@/modules/storage-repository/form/new/use-new-sr-form.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool, DISKOR_POOL_NAME, OTHER_POOL_ID, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { openSelect, pickSelectOption } from '@/test/select.ts'
import type { FormSelectId } from '@core/packages/form-select'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { SR_ACCESS_MODE, type SrType } from '@core/types/storage-repository.type.ts'
import { flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

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
  seedPools()
})

// The Storage tab of a pool opens the drawer without host, the one of a host with that host
function mountNewSrForm({ poolId = POOL.id, hostId }: { poolId?: FrontXoPool['id']; hostId?: FrontXoHost['id'] } = {}) {
  return mountComposableWithI18n(() => useNewSrForm(poolId, hostId))
}

type NewSrForm = ReturnType<typeof mountNewSrForm>

type UnwrappedNewSrForm = Pick<NewSrForm, 'nameInputBindings' | 'deviceInputBindings' | 'serverInputBindings'> & {
  type: SrType | undefined
}

async function chooseType(form: Pick<UnwrappedNewSrForm, 'type'>, type: SrType) {
  form.type = type
  await nextTick()
}

// The minimal valid form of a local SR (ext) or a shared one (SMB)
async function fillLocalSr(form: UnwrappedNewSrForm) {
  form.nameInputBindings['onUpdate:modelValue']('My SR')
  await chooseType(form, 'ext')
  form.deviceInputBindings['onUpdate:modelValue']('/dev/sdb')
}

async function fillSharedSr(form: UnwrappedNewSrForm) {
  form.nameInputBindings['onUpdate:modelValue']('My SR')
  await chooseType(form, 'smb')
  form.serverInputBindings['onUpdate:modelValue']('nas')
}

// A select only reacts once rendered: renders the one of `getSelectId`, the form being read back from `formHolder`
function mountWithFormSelect(
  getSelectId: (form: ReturnType<typeof useNewSrForm>) => FormSelectId,
  hostId?: FrontXoHost['id']
) {
  const formHolder: { form?: ReturnType<typeof useNewSrForm> } = {}

  const wrapper = mountWithSelect(() => {
    const form = useNewSrForm(POOL.id, hostId)
    formHolder.form = form

    return () => h(VtsSelect, { id: getSelectId(form), accent: 'brand' })
  })

  if (formHolder.form === undefined) {
    throw new Error('The form was not set up')
  }

  // The tests read and write the form as a mounted component exposes it: refs unwrapped
  const { form } = formHolder

  const unwrappedForm: UnwrappedNewSrForm & Pick<ReturnType<typeof useNewSrForm>, 'validateAndBuildPayload'> = {
    get nameInputBindings() {
      return form.nameInputBindings.value
    },
    get deviceInputBindings() {
      return form.deviceInputBindings.value
    },
    get serverInputBindings() {
      return form.serverInputBindings.value
    },
    get type() {
      return form.type.value
    },
    set type(type) {
      form.type.value = type
    },
    validateAndBuildPayload: form.validateAndBuildPayload,
  }

  return { wrapper, form: unwrappedForm, rawForm: form }
}

async function pickOption(wrapper: ReturnType<typeof mountWithSelect>, label: string) {
  await openSelect(wrapper)
  await pickSelectOption(wrapper, label)
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

describe('validateAndBuildPayload', () => {
  it('creates a shared SR on the master of the pool', async () => {
    const form = mountNewSrForm()
    await fillSharedSr(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({
      hostId: MASTER.id,
      name_label: 'My SR',
      SR_type: 'smb',
    })
  })

  it('creates a local SR on the host it was opened from', async () => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await fillLocalSr(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ hostId: SLAVE.id, SR_type: 'ext' })
  })

  it('creates a shared SR on the master of the pool once switched from a host', async () => {
    const form = mountNewSrForm({ hostId: SLAVE.id })

    form.accessModeInputBindings['onUpdate:modelValue'](SR_ACCESS_MODE.SHARED)
    await nextTick()
    await fillSharedSr(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ hostId: MASTER.id })
  })

  it('selects the pool and its master once the pools are loaded', async () => {
    xoCollectionsMock.startLoadingPools()
    const form = mountNewSrForm()

    seedPools()
    await nextTick()
    await fillSharedSr(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ hostId: MASTER.id })
  })

  it('requires the name and the type', async () => {
    const form = mountNewSrForm()

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.nameInputBindings.error).toEqual(requiredMessage())
    expect(form.typeSelectBindings.error).toEqual(requiredMessage())
  })

  it('requires the pool when the one it was opened from is unknown', async () => {
    const form = mountNewSrForm({ poolId: UNKNOWN_POOL_ID })
    await fillSharedSr(form)

    expect(await form.validateAndBuildPayload()).toBeUndefined()
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

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form[required].error).toEqual(requiredMessage())
    expect(form[notRequired].error).toBeUndefined()
  })

  it.each([
    { mode: 'local', hostId: SLAVE.id, fill: fillLocalSr },
    { mode: 'shared', hostId: undefined, fill: fillSharedSr },
  ])('creates the SR on the master of a pool chosen in $mode access mode', async ({ hostId, fill }) => {
    const { wrapper, form } = mountWithFormSelect(form => form.poolSelectBindings.value.id, hostId)
    await flushPromises()

    await pickOption(wrapper, DISKOR_POOL_NAME)
    await fill(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ hostId: OTHER_MASTER.id })
  })

  it('drops the preferred image formats of a type that does not take them', async () => {
    const { wrapper, form } = mountWithFormSelect(form => form.preferredImageFormatsSelectBindings.value.id, SLAVE.id)
    await fillLocalSr(form)
    await pickOption(wrapper, 'qcow2')

    await chooseType(form, 'local')
    await chooseType(form, 'ext')

    expect((await form.validateAndBuildPayload())?.device_config).not.toHaveProperty('preferred-image-formats')
  })
})

describe('preferredImageFormatsSelectBindings', () => {
  it('warns that a format with qcow2 needs qcow2 support on the host', async () => {
    const { wrapper, rawForm } = mountWithFormSelect(
      form => form.preferredImageFormatsSelectBindings.value.id,
      SLAVE.id
    )

    await pickOption(wrapper, 'vhd, qcow2')

    expect(rawForm.preferredImageFormatsSelectBindings.value.warning).toEqual({
      content: t('sr-preferred-image-formats-qcow2-warning'),
      accent: 'warning',
    })
  })

  it('does not warn for VHD alone', async () => {
    const { wrapper, rawForm } = mountWithFormSelect(
      form => form.preferredImageFormatsSelectBindings.value.id,
      SLAVE.id
    )

    await pickOption(wrapper, 'vhd')

    expect(rawForm.preferredImageFormatsSelectBindings.value.warning).toBeUndefined()
  })
})

describe('requiresEraseConfirm', () => {
  it.each([
    { type: 'lvm', expected: true },
    { type: 'ext', expected: true },
    { type: 'local', expected: false },
  ] as const)('is $expected for a $type SR', async ({ type, expected }) => {
    const form = mountNewSrForm({ hostId: SLAVE.id })
    await chooseType(form, type)

    expect(form.requiresEraseConfirm).toBe(expected)
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
