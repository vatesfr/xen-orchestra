import { useNewVmWizard } from '@/modules/vm/composables/use-new-vm-wizard.composable.ts'
import { provideNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import type { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { discardChangesModalMock } from '@/test/mock-discard-changes-modal.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import {
  chooseNewVmTemplate,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_POOL,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { flushPromises } from '@vue/test-utils'
import { useI18n } from 'vue-i18n'
import type { Router } from 'vue-router'

const { useXoVmCreateJobMock } = vi.hoisted(() => ({
  useXoVmCreateJobMock: vi.fn(),
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-create.job.ts'), () => ({
  useXoVmCreateJob: useXoVmCreateJobMock as unknown as typeof useXoVmCreateJob,
}))

vi.mock(
  import('@core/composables/modals/use-discard-changes-modal.ts'),
  () => import('@/test/mock-discard-changes-modal.ts')
)

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

type CreationResult = PromiseSettledResult<string>

const CREATED_VM: CreationResult = { status: 'fulfilled', value: 'vm-new' }

beforeEach(() => {
  resetNewVmCollections()
  useXoVmCreateJobMock.mockReset()
  discardChangesModalMock.reset()
})

function createPendingRun() {
  let finish: (results: CreationResult[]) => void = () => {}

  return {
    run: () => new Promise<CreationResult[]>(resolve => (finish = resolve)),
    finish: (results: CreationResult[]) => finish(results),
  }
}

function mountWizard({
  run = () => Promise.resolve([CREATED_VM]),
  canRun = true,
  isRunning = false,
  router = createTestRouter(),
}: { run?: () => Promise<CreationResult[]>; canRun?: boolean; isRunning?: boolean; router?: Router } = {}) {
  seedNewVmCollections()
  useXoVmCreateJobMock.mockReturnValue(createJobResult(run, { canRun, isRunning }))

  const { wrapper } = mountComposable(
    () => {
      const form = provideNewVmForm()

      return {
        vmState: form.vmState,
        errors: form.errors,
        fieldIds: form.fieldIds,
        t: useI18n().t,
        ...useNewVmWizard(form),
      }
    },
    { router }
  )

  return { wizard: wrapper.vm, wrapper, router }
}

async function mountWizardOnConfiguration(options: Parameters<typeof mountWizard>[0] = {}) {
  const mounted = mountWizard(options)

  await mounted.router.isReady()
  await chooseNewVmTemplate(mounted.wizard)
  await mounted.wizard.next()

  return mounted
}

async function mountWizardOnReview(options: Parameters<typeof mountWizard>[0] = {}) {
  const mounted = await mountWizardOnConfiguration(options)

  await mounted.wizard.next()

  return mounted
}

describe('steps', () => {
  it('names the three steps of the creation', () => {
    const { wizard } = mountWizard()

    expect(wizard.steps).toEqual([
      { label: wizard.t('new-vm:environment-setup') },
      { label: wizard.t('new-vm:vm-configuration') },
      { label: wizard.t('new-vm:review-details') },
    ])
  })
})

describe('next', () => {
  it('starts on the environment step', () => {
    expect(mountWizard().wizard.currentStep).toBe('environment')
  })

  it('stays on the environment step and shows what is missing without a pool and a template', async () => {
    const { wizard } = mountWizard()

    await wizard.next()

    expect(wizard.currentStep).toBe('environment')
    expect(wizard.errors).toEqual({
      pool: wizard.t('form:error:required'),
      template: wizard.t('form:error:required'),
    })
  })

  it('focuses the first field in error when the step is refused', async () => {
    const { wizard } = mountWizard()
    document.body.innerHTML = `<div id="${wizard.fieldIds.pool}"><input /></div>`

    await wizard.next()

    expect(document.activeElement).toBe(document.querySelector('input'))
  })

  it('moves to the configuration step once a pool and a template are chosen', async () => {
    const { wizard } = await mountWizardOnConfiguration()

    expect(wizard.currentStep).toBe('configuration')
    expect(wizard.currentStepIndex).toBe(1)
  })

  it('stays on the configuration step while the VM has no name', async () => {
    const { wizard } = await mountWizardOnConfiguration()
    wizard.vmState.name = ''

    await wizard.next()

    expect(wizard.currentStep).toBe('configuration')
    expect(wizard.errors.name).toBe(wizard.t('form:error:required'))
  })

  it('moves to the review step once the configuration is valid', async () => {
    const { wizard } = await mountWizardOnReview()

    expect(wizard.currentStep).toBe('review')
  })

  it('does not go past the review step', async () => {
    const { wizard } = await mountWizardOnReview()

    await wizard.next()

    expect(wizard.currentStep).toBe('review')
  })

  it('moves one step only when continued twice at once', async () => {
    const { wizard } = mountWizard()
    await chooseNewVmTemplate(wizard)

    await Promise.all([wizard.next(), wizard.next()])

    expect(wizard.currentStep).toBe('configuration')
  })

  it('writes the step reached in the route, keeping the rest of its query', async () => {
    const router = createTestRouter()
    await router.push({ query: { poolid: NEW_VM_POOL.id } })

    await mountWizardOnReview({ router })

    expect(router.currentRoute.value.query).toEqual({ poolid: NEW_VM_POOL.id, step: 'review' })
  })
})

describe('back', () => {
  it('returns to the previous step', async () => {
    const { wizard } = await mountWizardOnReview()

    wizard.back()
    await flushPromises()

    expect(wizard.currentStep).toBe('configuration')
  })

  it('stays on the first step', async () => {
    const { wizard, router } = mountWizard()
    await flushPromises()
    const startRoute = router.currentRoute.value.fullPath

    wizard.back()
    await flushPromises()

    expect(wizard.currentStep).toBe('environment')
    expect(router.currentRoute.value.fullPath).toBe(startRoute)
  })
})

describe('browser history', () => {
  it('returns to the previous steps as the browser goes back', async () => {
    const { wizard, router } = await mountWizardOnReview()

    router.back()
    await flushPromises()

    expect(wizard.currentStep).toBe('configuration')

    router.back()
    await flushPromises()

    expect(wizard.currentStep).toBe('environment')
    expect(router.currentRoute.value.query.step).toBeUndefined()
  })

  it('moves forward again as the browser goes forward over valid steps', async () => {
    const { wizard, router } = await mountWizardOnReview()
    router.go(-2)
    await flushPromises()

    expect(wizard.currentStep).toBe('environment')

    router.go(2)
    await flushPromises()

    expect(wizard.currentStep).toBe('review')
  })

  it('stays on a step that is no longer valid when the browser goes forward, telling what is wrong', async () => {
    const { wizard, router } = await mountWizardOnReview()
    router.back()
    await flushPromises()
    wizard.vmState.name = ''

    router.forward()
    await flushPromises()

    expect(wizard.currentStep).toBe('configuration')
    expect(router.currentRoute.value.query.step).toBe('configuration')
    expect(wizard.errors.name).toBe(wizard.t('form:error:required'))
  })

  it('starts on the environment step when opened on a later one, the form being empty', async () => {
    const router = createTestRouter()
    await router.push({ query: { poolid: NEW_VM_POOL.id, step: 'review' } })

    const { wizard } = mountWizard({ router })
    await flushPromises()

    expect(wizard.currentStep).toBe('environment')
    expect(router.currentRoute.value.query).toEqual({ poolid: NEW_VM_POOL.id })
  })
})

describe('tasksRoute', () => {
  it('leads to the tasks of the chosen pool', async () => {
    const { wizard } = await mountWizardOnConfiguration()

    expect(wizard.tasksRoute).toEqual({ name: '/pool/[id]/tasks', params: { id: NEW_VM_POOL.id } })
  })

  it('leads to all the tasks without a pool', () => {
    expect(mountWizard().wizard.tasksRoute).toEqual({ name: '/(site)/tasks' })
  })
})

describe('cancel', () => {
  it('leads to the dashboard of the chosen pool once the user discards the form', async () => {
    discardChangesModalMock.answer('onConfirm')
    const { wizard, router } = await mountWizardOnConfiguration()

    await wizard.cancel()

    expect(router.currentRoute.value).toMatchObject({ name: '/pool/[id]/dashboard', params: { id: NEW_VM_POOL.id } })
  })

  it('stays on the form, as it was filled in, when the user keeps editing', async () => {
    discardChangesModalMock.answer('onCancel')
    const { wizard, router } = await mountWizardOnConfiguration()
    const startRoute = router.currentRoute.value.fullPath

    await wizard.cancel()

    expect(router.currentRoute.value.fullPath).toBe(startRoute)
    expect(wizard.currentStep).toBe('configuration')
    expect(wizard.vmState.new_vm_template?.uuid).toBe(NEW_VM_DISK_TEMPLATE.uuid)
  })

  it('leads to the site dashboard at once when nothing was chosen', async () => {
    const { wizard, router } = mountWizard()

    await wizard.cancel()

    expect(router.currentRoute.value.name).toBe('/(site)/dashboard')
    expect(discardChangesModalMock.open).not.toHaveBeenCalled()
  })
})

describe('canCreate', () => {
  it('is true when the job can run', async () => {
    expect((await mountWizardOnReview()).wizard.canCreate).toBe(true)
  })

  it('is false when the job cannot run', async () => {
    expect((await mountWizardOnReview({ canRun: false })).wizard.canCreate).toBe(false)
  })
})

describe('isCreating', () => {
  it('is true while the VM is being created, then false again', async () => {
    const { run, finish } = createPendingRun()
    const { wizard } = await mountWizardOnReview({ run })

    const creation = wizard.create()

    expect(wizard.isCreating).toBe(true)

    finish([{ status: 'rejected', reason: new Error('Not enough memory') }])
    await creation

    expect(wizard.isCreating).toBe(false)
  })

  it('stays false while a creation started from another visit of the page is running', () => {
    const { wizard } = mountWizard({ isRunning: true, canRun: false })

    expect(wizard.isCreating).toBe(false)
    expect(wizard.isCreateJobRunning).toBe(true)
  })
})

describe('create', () => {
  it('opens the dashboard of the created VM', async () => {
    const { wizard, router } = await mountWizardOnReview()

    await wizard.create()

    expect(router.currentRoute.value).toMatchObject({ name: '/vm/[id]/dashboard', params: { id: 'vm-new' } })
    expect(wizard.creationError).toBeUndefined()
    expect(discardChangesModalMock.open).not.toHaveBeenCalled()
  })

  it('creates nothing when the job cannot run', async () => {
    const run = vi.fn(() => Promise.resolve([CREATED_VM]))
    const { wizard } = await mountWizardOnReview({ run, canRun: false })

    await wizard.create()

    expect(run).not.toHaveBeenCalled()
  })

  it('lets the user leave without asking while the VM is being created', async () => {
    const { wizard, router } = await mountWizardOnReview({ run: createPendingRun().run })
    void wizard.create()

    await wizard.cancel()

    expect(router.currentRoute.value.name).toBe('/pool/[id]/dashboard')
    expect(discardChangesModalMock.open).not.toHaveBeenCalled()
  })

  it('stays where the user went when the page was left before the VM is created', async () => {
    const { run, finish } = createPendingRun()
    const { wizard, wrapper, router } = await mountWizardOnReview({ run })
    const creation = wizard.create()

    wrapper.unmount()
    finish([CREATED_VM])
    await creation
    await flushPromises()

    expect(router.currentRoute.value.name).not.toBe('/vm/[id]/dashboard')
  })

  it('keeps the error of a creation that failed', async () => {
    const error = new Error('Not enough memory')
    const { wizard, router } = await mountWizardOnReview({
      run: () => Promise.resolve([{ status: 'rejected', reason: error }]),
    })

    await wizard.create()

    expect(wizard.creationError).toBe(error)
    expect(router.currentRoute.value.name).not.toBe('/vm/[id]/dashboard')
  })

  it('wraps a failure that is not an error', async () => {
    const { wizard } = await mountWizardOnReview({
      run: () => Promise.resolve([{ status: 'rejected', reason: { code: 'VM_PROVISION_FAILED' } }]),
    })

    await wizard.create()

    expect(wizard.creationError?.message).toBe('{"code":"VM_PROVISION_FAILED"}')
  })
})

describe('dismissCreationError', () => {
  it('forgets the error so the form shows again', async () => {
    const { wizard } = await mountWizardOnReview({
      run: () => Promise.resolve([{ status: 'rejected', reason: new Error('Not enough memory') }]),
    })
    await wizard.create()

    wizard.dismissCreationError()

    expect(wizard.creationError).toBeUndefined()
  })
})
