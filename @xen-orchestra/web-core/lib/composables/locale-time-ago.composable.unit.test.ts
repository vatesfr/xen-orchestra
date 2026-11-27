import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { mountComposable } from '@core-test/mount-composable.ts'
import { nextTick } from 'vue'

const NOW = new Date('2026-01-01T12:00:00Z').getTime()

beforeEach(() => {
  vi.useFakeTimers({ now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

function mountTimeAgo(referenceDate: number) {
  return mountComposable(() => ({ timeAgo: useTimeAgo(referenceDate) })).wrapper
}

it('formats the time elapsed since the reference date', () => {
  expect(mountTimeAgo(NOW - 30_000).vm.timeAgo).toBe('30 seconds ago')
  expect(mountTimeAgo(NOW - 2 * 60 * 60_000).vm.timeAgo).toBe('2 hours ago')
})

it('updates as time goes by', async () => {
  const wrapper = mountTimeAgo(NOW - 30_000)

  vi.advanceTimersByTime(60_000)
  await nextTick()

  expect(wrapper.vm.timeAgo).toBe('1 minute ago')
})

it('shares one timer between all its users, until the last one is unmounted', () => {
  const timerCount = vi.getTimerCount()

  const first = mountTimeAgo(NOW)

  expect(vi.getTimerCount()).toBe(timerCount + 1)

  const second = mountTimeAgo(NOW)

  expect(vi.getTimerCount()).toBe(timerCount + 1)

  first.unmount()

  expect(vi.getTimerCount()).toBe(timerCount + 1)

  second.unmount()

  expect(vi.getTimerCount()).toBe(timerCount)
})
