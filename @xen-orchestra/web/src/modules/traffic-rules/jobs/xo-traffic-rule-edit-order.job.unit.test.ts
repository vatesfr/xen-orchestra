import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTrafficRuleEditOrderJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-order.job.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { SDN_CONTROLLER_OF_METHOD_KEY, type TrafficRule, type XoNetwork } from '@vates/types'

const { post, monitorTask, pool } = vi.hoisted(() => ({
  post: vi.fn(),
  monitorTask: vi.fn(),
  pool: { otherConfig: {} as Record<string, string> },
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

// The task collection would open an SSE subscription
vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolById: () => pool,
  })) as unknown as typeof useXoPoolCollection,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  post.mockReset()
  monitorTask.mockReset()

  post.mockImplementation(async (url: string) => ({ taskId: `task-of-${url}` }))
  monitorTask.mockResolvedValue(undefined)
  pool.otherConfig = { [SDN_CONTROLLER_OF_METHOD_KEY]: 'xapi-plugin' }
})

const NETWORK_ID = 'network-1' as XoNetwork['id']

const NETWORK = { id: NETWORK_ID, $pool: 'pool-1' } as FrontXoNetwork

const ENDPOINT = `plugins/sdn-controller/networks/${NETWORK_ID}/actions/update_traffic_rule`

function createRule(id: string, priority: number | undefined): TrafficRule {
  return {
    id,
    allow: true,
    protocol: 'TCP',
    ipRange: '10.0.0.0/8',
    direction: 'to',
    priority,
    networkId: NETWORK_ID,
    type: 'network',
    sourceId: NETWORK_ID,
  }
}

function mountEditOrderJob(
  networkRules: TrafficRule[],
  orderedRules: TrafficRule[] | undefined,
  network: FrontXoNetwork | undefined = NETWORK
) {
  return mountComposable(() =>
    useXoTrafficRuleEditOrderJob(
      () => networkRules,
      () => orderedRules,
      () => network
    )
  ).wrapper.vm
}

function getNewPriorities() {
  return post.mock.calls.map(([, body]) => body.newRule.priority)
}

describe('run', () => {
  it('updates nothing when the order is unchanged', async () => {
    const rules = [createRule('a', 300), createRule('b', 200), createRule('c', 100)]

    await mountEditOrderJob(rules, rules).run()

    expect(post).not.toHaveBeenCalled()
  })

  it('only updates the moved rule, with a priority above the rules it now precedes', async () => {
    const [firstRule, secondRule, thirdRule] = [createRule('a', 300), createRule('b', 200), createRule('c', 100)]

    await mountEditOrderJob([firstRule, secondRule, thirdRule], [thirdRule, firstRule, secondRule]).run()

    expect(post.mock.calls).toEqual([
      [ENDPOINT, { oldRule: expect.objectContaining({ priority: 100 }), newRule: { priority: expect.any(Number) } }],
    ])
    expect(getNewPriorities()[0]).toBeGreaterThan(300)
  })

  it('never gives a priority a rule of the network already has', async () => {
    const [firstRule, secondRule, thirdRule, fourthRule] = [
      createRule('a', 400),
      createRule('b', 300),
      createRule('c', 200),
      createRule('d', 100),
    ]

    await mountEditOrderJob(
      [firstRule, secondRule, thirdRule, fourthRule],
      [secondRule, fourthRule, firstRule, thirdRule]
    ).run()

    const newPriorities = getNewPriorities()

    newPriorities.forEach(priority => expect([400, 300, 200, 100]).not.toContain(priority))
  })

  it('never gives a priority a rule of the network missing from the order already has', async () => {
    const [firstRule, secondRule, thirdRule, fourthRule] = [
      createRule('a', 5),
      createRule('b', 2),
      createRule('c', 0),
      createRule('d', 1),
    ]
    // added on the network while the order was being edited
    const addedRule = createRule('x', 3)

    await mountEditOrderJob(
      [firstRule, secondRule, thirdRule, fourthRule, addedRule],
      [firstRule, thirdRule, secondRule, fourthRule]
    ).run()

    getNewPriorities().forEach(priority => expect(priority).not.toBe(3))
  })

  it('renumbers all the rules when there is no room between the kept ones', async () => {
    const [firstRule, secondRule] = [createRule('a', 1), createRule('b', 0)]

    await mountEditOrderJob([firstRule, secondRule], [secondRule, firstRule]).run()

    const [firstPriority, secondPriority] = getNewPriorities()

    expect(post.mock.calls.map(([, body]) => body.oldRule.priority)).toEqual([0, 1])
    expect(firstPriority).toBeGreaterThan(secondPriority)
  })

  it('gives a priority to the rules that have none', async () => {
    const [firstRule, secondRule] = [createRule('a', undefined), createRule('b', undefined)]

    await mountEditOrderJob([firstRule, secondRule], [secondRule, firstRule]).run()

    const [firstPriority, secondPriority] = getNewPriorities()

    expect(firstPriority).toBeGreaterThan(secondPriority)
  })

  it('applies the updates one at a time and stops at the first failure', async () => {
    const [firstRule, secondRule] = [createRule('a', 1), createRule('b', 0)]
    const error = new Error('Update failed')
    monitorTask.mockRejectedValueOnce(error)

    await expect(mountEditOrderJob([firstRule, secondRule], [secondRule, firstRule]).run()).rejects.toBe(error)

    expect(post).toHaveBeenCalledTimes(1)
  })
})

describe('validate', () => {
  it('can run with at least 2 rules on a network using the XAPI plugin', () => {
    const rules = [createRule('a', 200), createRule('b', 100)]

    expect(mountEditOrderJob(rules, undefined).canRun).toBe(true)
  })

  it('cannot run without a network', () => {
    const rules = [createRule('a', 200), createRule('b', 100)]

    const job = mountComposable(() =>
      useXoTrafficRuleEditOrderJob(
        () => rules,
        () => undefined,
        () => undefined
      )
    ).wrapper.vm

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:network-required'))
  })

  it('cannot run with less than 2 rules', () => {
    const job = mountEditOrderJob([createRule('a', 100)], undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:traffic-rule-edit-order:not-enough-rules', { n: 2 }))
  })

  it('cannot run without the XAPI plugin', () => {
    pool.otherConfig = {}

    const job = mountEditOrderJob([createRule('a', 200), createRule('b', 100)], undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('traffic-rules:xapi-plugin-required'))
  })
})
