import { createTestRouter } from '@/test/create-test-router.ts'
import { routeQueryMock } from '@/test/mock-route-query.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import type { RouteLocationRaw, Router } from 'vue-router'

type SettledResults = PromiseSettledResult<unknown>[]

type ConfirmOptions = { router?: Router }

/**
 * The `run` spy of a job a composable runs detached, the modal closing right away: `mockSuccess` makes it hand the
 * results to `onSuccess`, like a successful job, after `beforeSuccess`; `settled()` is what that handling returned,
 * to wait for. Reset before each test.
 */
export function createDetachedJobRun(run: ReturnType<typeof vi.fn>) {
  let successHandled: unknown

  beforeEach(() => {
    successHandled = undefined
  })

  return {
    run,
    mockSuccess(results: SettledResults, beforeSuccess?: () => void) {
      run.mockImplementation(({ onSuccess }: { onSuccess: (results: SettledResults) => unknown }) => {
        beforeSuccess?.()
        successHandled = onSuccess(results)
      })
    },
    settled: () => successHandled,
  }
}

type DetachedJobRun = ReturnType<typeof createDetachedJobRun>

type TypeToConfirmTexts = { title: string; description: string; confirmationText: string; confirmLabel: string }

// What the composable opens its type to confirm modal with (an overlay of `mock-overlay.ts`) for several items
export function typeToConfirmModalOpening(texts: TypeToConfirmTexts) {
  return {
    props: { accent: 'danger', icon: 'status:danger-picto', ...texts },
    events: { onConfirm: expect.any(Function) },
  }
}

type ConfirmModals = { singleModal: { open: unknown }; typeToConfirmModal: { open: unknown } }

/**
 * Registers the test of a composable asking to type to confirm its action on several items, rather than opening its
 * modal for a single item: `start` mounts it on several items, starts the action and returns both modals.
 */
export function itAsksToTypeToConfirm(name: string, start: () => ConfirmModals, texts: TypeToConfirmTexts) {
  it(name, () => {
    const { singleModal, typeToConfirmModal } = start()

    expect(singleModal.open).not.toHaveBeenCalled()
    expect(typeToConfirmModal.open).toHaveBeenCalledWith(typeToConfirmModalOpening(texts))
  })
}

export async function createRouterOnPage(name: string, id: string) {
  const router = createTestRouter()

  await router.push({ name, params: { id } } as RouteLocationRaw)

  return router
}

type SelectionJobCase<TItem extends { id: string }> = {
  // How the test names call an item, the items, the action done and being done
  wording: { item: string; items: string; done: string; doing: string }
  items: [TItem, TItem]
  detachedRun: DetachedJobRun
  // Mounts the composable on the items, starts the action, confirms it, then waits for the success handling
  confirm: (items: MaybeRefOrGetter<TItem[]>, options?: ConfirmOptions) => Promise<void>
  // The error of an item the job failed on
  errorMessage: string
}

/**
 * Registers the tests every composable running a detached job on the selected items shares, once its modal is
 * confirmed: it unselects the item the side panel shows (the mocked route query) once the job succeeded on it, keeps
 * it otherwise, also when the items change during the job unless `itemsChange` is false.
 */
export function itUnselectsOnSuccess<TItem extends { id: string }>(
  { wording, items: [firstItem, secondItem], detachedRun, confirm, errorMessage }: SelectionJobCase<TItem>,
  { itemsChange = true }: { itemsChange?: boolean } = {}
) {
  it('runs the job detached so the modal closes right away', async () => {
    await confirm([firstItem])

    expect(detachedRun.run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it(`unselects the ${wording.item} shown in the side panel once ${wording.done}`, async () => {
    detachedRun.mockSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ])
    routeQueryMock.query.value = secondItem.id

    await confirm([firstItem, secondItem])

    expect(routeQueryMock.query.value).toBe('')
  })

  it(`keeps the ${wording.item} shown in the side panel selected when ${wording.doing} it failed`, async () => {
    detachedRun.mockSuccess([
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error(errorMessage) },
    ])
    routeQueryMock.query.value = secondItem.id

    await confirm([firstItem, secondItem])

    expect(routeQueryMock.query.value).toBe(secondItem.id)
  })

  it(`keeps another ${wording.item} shown in the side panel selected`, async () => {
    detachedRun.mockSuccess([{ status: 'fulfilled', value: undefined }])
    routeQueryMock.query.value = secondItem.id

    await confirm([firstItem])

    expect(routeQueryMock.query.value).toBe(secondItem.id)
  })

  if (itemsChange) {
    it(`unselects the ${wording.done} ${wording.item} even when the ${wording.items} change during the job`, async () => {
      const items = ref([firstItem, secondItem])
      routeQueryMock.query.value = secondItem.id

      // The items the job ran on leave the collection before the job is over
      detachedRun.mockSuccess(
        [
          { status: 'fulfilled', value: undefined },
          { status: 'fulfilled', value: undefined },
        ],
        () => {
          items.value = []
        }
      )

      await confirm(items as MaybeRefOrGetter<TItem[]>)

      expect(routeQueryMock.query.value).toBe('')
    })
  }
}

type RedirectionCase<TItem> = {
  // The route of the page of an item
  itemPage: string
  // Where the page of an item redirects once the job succeeded on it, and how the test name says it
  redirection: { to: (item: TItem) => object; wording: string }
}

/**
 * Registers the tests every composable running a detached job on the selected items shares when the current page
 * is the page of one of them: it leaves that page once the job succeeded on its item, and stays otherwise.
 */
export function itRedirectsOnSuccess<TItem extends { id: string }>(
  { wording, items: [firstItem, secondItem], detachedRun, confirm, errorMessage }: SelectionJobCase<TItem>,
  { itemPage, redirection }: RedirectionCase<TItem>
) {
  it(`redirects ${redirection.wording} once the ${wording.item} of the current page is ${wording.done}`, async () => {
    detachedRun.mockSuccess([{ status: 'fulfilled', value: undefined }])
    const router = await createRouterOnPage(itemPage, firstItem.id)

    await confirm([firstItem], { router })

    expect(router.currentRoute.value).toMatchObject(redirection.to(firstItem))
  })

  it(`stays on the ${wording.item} page when ${wording.doing} it failed`, async () => {
    detachedRun.mockSuccess([{ status: 'rejected', reason: new Error(errorMessage) }])
    const router = await createRouterOnPage(itemPage, firstItem.id)

    await confirm([firstItem], { router })

    expect(router.currentRoute.value.name).toBe(itemPage)
  })

  it(`stays on the page of another ${wording.item}`, async () => {
    detachedRun.mockSuccess([{ status: 'fulfilled', value: undefined }])
    const router = await createRouterOnPage(itemPage, secondItem.id)

    await confirm([firstItem], { router })

    expect(router.currentRoute.value.name).toBe(itemPage)
  })
}
