import { useUnsavedChangesGuard } from '@/shared/composables/unsaved-changes-guard.composable.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { discardChangesModalMock, mockDiscardChangesModal } from '@/test/mock-discard-changes-modal.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

mockDiscardChangesModal()

beforeEach(() => {
  discardChangesModalMock.reset()
})

async function mountGuardOnNewVm(hasUnsavedChanges: boolean) {
  const router = createTestRouter()
  await router.push('/vm/new')

  const isDirty = ref(hasUnsavedChanges)

  const { wrapper } = mountComposable(
    () => {
      useUnsavedChangesGuard(isDirty)

      return {}
    },
    { router }
  )

  return { router, wrapper, isDirty }
}

function closeTab() {
  const event = new Event('beforeunload', { cancelable: true })

  window.dispatchEvent(event)

  return event
}

describe('leaving the page', () => {
  it('leaves at once without unsaved changes', async () => {
    const { router } = await mountGuardOnNewVm(false)

    await router.push('/tasks')

    expect(router.currentRoute.value.path).toBe('/tasks')
    expect(discardChangesModalMock.open).not.toHaveBeenCalled()
  })

  it('stays on the page when the user keeps editing', async () => {
    discardChangesModalMock.answer('onCancel')
    const { router } = await mountGuardOnNewVm(true)

    await router.push('/tasks')

    expect(router.currentRoute.value.path).toBe('/vm/new')
  })

  it('leaves once the user discards the changes', async () => {
    discardChangesModalMock.answer('onConfirm')
    const { router } = await mountGuardOnNewVm(true)

    await router.push('/tasks')

    expect(router.currentRoute.value.path).toBe('/tasks')
    expect(discardChangesModalMock.open).toHaveBeenCalledTimes(1)
  })

  it('asks only once while the question is pending', async () => {
    discardChangesModalMock.open.mockReturnValue(new Promise(() => {}))
    const { router } = await mountGuardOnNewVm(true)

    void router.push('/tasks')
    void router.push('/settings')
    await flushPromises()

    expect(discardChangesModalMock.open).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/vm/new')
  })

  it('does not ask when only the query of the page changes', async () => {
    const { router } = await mountGuardOnNewVm(true)

    await router.push({ path: '/vm/new', query: { poolid: 'pool-789' } })

    expect(router.currentRoute.value.query).toEqual({ poolid: 'pool-789' })
    expect(discardChangesModalMock.open).not.toHaveBeenCalled()
  })

  it('follows the changes made after the guard is set', async () => {
    discardChangesModalMock.answer('onCancel')
    const { router, isDirty } = await mountGuardOnNewVm(false)

    isDirty.value = true
    await router.push('/tasks')

    expect(router.currentRoute.value.path).toBe('/vm/new')
  })

  it('no longer asks once the page is gone', async () => {
    const { router, wrapper } = await mountGuardOnNewVm(true)

    wrapper.unmount()
    await router.push('/tasks')

    expect(router.currentRoute.value.path).toBe('/tasks')
    expect(discardChangesModalMock.open).not.toHaveBeenCalled()
  })
})

describe('closing the tab', () => {
  it('lets the browser ask with unsaved changes', async () => {
    await mountGuardOnNewVm(true)

    expect(closeTab().defaultPrevented).toBe(true)
  })

  it('lets the tab close without unsaved changes', async () => {
    await mountGuardOnNewVm(false)

    expect(closeTab().defaultPrevented).toBe(false)
  })
})
