import {
  placementRefusalOf,
  useVdfPlacementOverride,
  type VdfPlacementRefusal,
} from '@/modules/vdf/composables/vdf-placement.composable.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'

// vdf#141: a start, resume or migration the firewall refuses, and its
// override (bypassFirewallCheck) for the users it allows

// every modal opened (confirm or info) answers with `answer`, once `release` is called
const { opened, modal } = vi.hoisted(() => ({
  opened: [] as Record<string, unknown>[],
  modal: { answer: 'onConfirm', release: Promise.resolve() as Promise<unknown> },
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: (() => ({
    open: async ({ props }: { props: Record<string, unknown> }) => {
      opened.push(props)
      await modal.release

      return { event: modal.answer }
    },
  })) as unknown as typeof useOverlay,
}))

const refusal = (allowed: boolean, operation: VdfPlacementRefusal['operation'] = 'start'): VdfPlacementRefusal => ({
  operation,
  vm: { id: 'vm-1', name: 'web-1' },
  host: { id: 'host-2', name: 'xcp2' },
  guard: 'firewall',
  reason: 'no firewall agent on host "xcp2"',
  bypass: { parameter: 'bypassFirewallCheck', allowed, who: 'XO administrators' },
})

const refused = (data: unknown, status = 403) => new ApiError('Forbidden', { status, cause: { error: 'x', data } })

// what `place` is called with, refused the first time
function placing(error: unknown) {
  const calls: boolean[] = []
  const place = async (bypass: boolean) => {
    calls.push(bypass)
    if (calls.length === 1) {
      throw error
    }
    return 'placed'
  }
  return { calls, place }
}

const mountOverride = () => mountComposable(() => useVdfPlacementOverride()).wrapper.vm

beforeEach(() => {
  opened.length = 0
  modal.answer = 'onConfirm'
  modal.release = Promise.resolve()
})

it("tells the firewall's refusal from other errors", () => {
  expect(placementRefusalOf(refused(refusal(true)))).toEqual(refusal(true))
  expect(placementRefusalOf(refused({ operation: 'Backup is running', reason: 'a backup runs' }))).toBeUndefined()
  expect(placementRefusalOf(refused(refusal(true), 500))).toBeUndefined()
  expect(placementRefusalOf(new Error('down'))).toBeUndefined()
})

it('asks a user allowed to override whether to go on without the firewall, and does', async () => {
  const { calls, place } = placing(refused(refusal(true)))

  expect(await mountOverride().placeWithOverride(place)).toBe('placed')
  expect(calls).toEqual([false, true])
  expect(opened).toEqual([
    expect.objectContaining({
      title: t('firewall:placement:start:title', { vm: 'web-1' }),
      message: t('firewall:placement:message', { reason: 'no firewall agent on host "xcp2"' }),
      confirmLabel: t('firewall:placement:start:anyway'),
    }),
  ])
})

it('goes no further when they go back', async () => {
  const error = refused(refusal(true, 'migrate'))
  const { calls, place } = placing(error)
  modal.answer = 'onCancel'

  await expect(mountOverride().placeWithOverride(place)).rejects.toBe(error)
  expect(calls).toEqual([false])
})

it('tells the others why, and who may', async () => {
  const error = refused(refusal(false))
  const { calls, place } = placing(error)

  await expect(mountOverride().placeWithOverride(place)).rejects.toBe(error)
  expect(calls).toEqual([false])
  expect(opened).toEqual([
    {
      title: t('firewall:placement:start:refused', { vm: 'web-1' }),
      content: 'no firewall agent on host "xcp2"',
      tip: t('firewall:placement:who', { who: 'XO administrators' }),
    },
  ])
})

it('leaves any other error alone', async () => {
  const error = new ApiError('Internal', { status: 500 })
  const { calls, place } = placing(error)

  await expect(mountOverride().placeWithOverride(place)).rejects.toBe(error)
  expect(calls).toEqual([false])
  expect(opened).toEqual([])
})

it('asks about several VMs one after the other', async () => {
  let release!: () => void
  modal.release = new Promise<void>(resolve => (release = resolve))
  const { placeWithOverride } = mountOverride()

  const first = placeWithOverride(placing(refused(refusal(true))).place)
  const second = placeWithOverride(placing(refused(refusal(true))).place)
  await vi.waitFor(() => expect(opened.length).toBe(1))
  // the second question waits for the first answer
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(opened.length).toBe(1)
  release()

  expect(await Promise.all([first, second])).toEqual(['placed', 'placed'])
  expect(opened.length).toBe(2)
})
