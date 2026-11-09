import { settleSequentially } from '@/shared/utils/promise.util.ts'
import { describe, expect, it } from 'vitest'

describe('settleSequentially', () => {
  it('starts each task once the previous one has settled', async () => {
    const events: string[] = []

    const createTask = (name: string) => async () => {
      events.push(`start ${name}`)
      await Promise.resolve()
      events.push(`end ${name}`)

      return name
    }

    await settleSequentially([createTask('a'), createTask('b')])

    expect(events).toEqual(['start a', 'end a', 'start b', 'end b'])
  })

  it('settles every task even when one of them fails', async () => {
    const error = new Error('failed')

    const results = await settleSequentially([
      () => Promise.resolve(1),
      () => Promise.reject(error),
      () => Promise.resolve(3),
    ])

    expect(results).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: 3 },
    ])
  })

  it('returns an empty list when there is no task', async () => {
    expect(await settleSequentially([])).toEqual([])
  })
})
