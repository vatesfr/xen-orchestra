import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTrafficRuleEditOrderJob } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit-order.job.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createPool } from '@/test/create-pool.ts'
import { createTrafficRule } from '@/test/create-traffic-rule.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itCanRun } from '@/test/job-cases.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { answerPostsWithTask, taskUtilsMock, mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { SDN_CONTROLLER_OF_METHOD_KEY, type TrafficRule, type XoNetwork } from '@vates/types'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

mockXoCollections('pool')

beforeEach(() => {
  vi.restoreAllMocks()
  taskUtilsMock.reset()

  answerPostsWithTask(post)
  xoCollectionsMock.reset()
  givenPoolOtherConfig({ [SDN_CONTROLLER_OF_METHOD_KEY]: 'xapi-plugin' })
})

const NETWORK_ID = 'network-1' as XoNetwork['id']

const NETWORK = { id: NETWORK_ID, $pool: 'pool-1' } as FrontXoNetwork

function givenPoolOtherConfig(otherConfig: FrontXoPool['otherConfig']) {
  xoCollectionsMock.pools.value = [createPool({ id: NETWORK.$pool, otherConfig })]
}

const ENDPOINT = `plugins/sdn-controller/networks/${NETWORK_ID}/actions/update_traffic_rule`

function createRule(id: string, priority: number | undefined): TrafficRule {
  return createTrafficRule({ id, priority, networkId: NETWORK_ID, sourceId: NETWORK_ID })
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

  // `priorities`: the rules of the network; `order`: the new order, as indexes, leaving out a rule added on the network
  // while the order was being edited
  it.each([
    {
      name: 'never gives a priority a rule of the network already has',
      priorities: [400, 300, 200, 100],
      order: [1, 3, 0, 2],
      taken: [400, 300, 200, 100],
    },
    {
      name: 'never gives a priority a rule of the network missing from the order already has',
      priorities: [5, 2, 0, 1, 3],
      order: [0, 2, 1, 3],
      taken: [3],
    },
  ])('$name', async ({ priorities, order, taken }) => {
    const rules = priorities.map((priority, index) => createRule(`rule-${index}`, priority))

    await mountEditOrderJob(
      rules,
      order.map(index => rules[index])
    ).run()

    getNewPriorities().forEach(priority => expect(taken).not.toContain(priority))
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

  it('fails without updating anything when the network has no free priority left', async () => {
    const networkRules = Array.from({ length: 65536 }, (_, priority) => createRule(`rule-${priority}`, priority))

    await expect(mountEditOrderJob(networkRules, [networkRules[0], networkRules[1]]).run()).rejects.toThrow(
      t('job:traffic-rule-edit-order:no-free-priority')
    )

    expect(post).not.toHaveBeenCalled()
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
  itCanRun([
    {
      name: 'can run with at least 2 rules on a network using the XAPI plugin',
      mountJob: () => mountEditOrderJob([createRule('a', 200), createRule('b', 100)], undefined),
    },
  ])

  itCannotRun([
    {
      name: 'cannot run without a network',
      mountJob: () =>
        mountComposable(() =>
          useXoTrafficRuleEditOrderJob(
            () => [createRule('a', 200), createRule('b', 100)],
            () => undefined,
            () => undefined
          )
        ).wrapper.vm,
      errorMessage: t('job:arg:network-required'),
    },
    {
      name: 'cannot run with less than 2 rules',
      mountJob: () => mountEditOrderJob([createRule('a', 100)], undefined),
      errorMessage: t('job:traffic-rule-edit-order:not-enough-rules', { n: 2 }),
    },
    {
      name: 'cannot run without the XAPI plugin',
      mountJob: () => {
        givenPoolOtherConfig({})

        return mountEditOrderJob([createRule('a', 200), createRule('b', 100)], undefined)
      },
      errorMessage: t('traffic-rules:xapi-plugin-required'),
    },
  ])
})
