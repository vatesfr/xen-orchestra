import {
  type TrafficRulePayload,
  useXoTrafficRuleCreateJob,
} from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import {
  MAX_TRAFFIC_RULE_PRIORITY,
  MIN_TRAFFIC_RULE_PRIORITY,
} from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun } from '@/test/job-cases.ts'
import { answerPostsWithTask, taskUtilsMock, mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import type { XoNetwork } from '@vates/types'

const post = mockedExport(fetchPost)

// The task collection would open an SSE subscription
mockXoTaskUtils()

beforeEach(() => {
  taskUtilsMock.reset()

  answerPostsWithTask(post)
})

function createPayload(overrides: Partial<TrafficRulePayload> = {}): TrafficRulePayload {
  return {
    targetType: 'network',
    targetId: 'network-1' as XoNetwork['id'],
    allow: true,
    direction: 'from',
    protocol: 'ICMP',
    ipRange: '192.168.1.0/24',
    port: null,
    ...overrides,
  }
}

function mountCreateJob(payloads: TrafficRulePayload[]) {
  return mountComposable(() => useXoTrafficRuleCreateJob(() => payloads)).wrapper.vm
}

describe('run', () => {
  it('sends the priority of the rule', async () => {
    await mountCreateJob([createPayload({ priority: 32758 })]).run()

    expect(post).toHaveBeenCalledWith(
      'plugins/sdn-controller/networks/network-1/actions/add_traffic_rule',
      expect.objectContaining({ priority: 32758 })
    )
  })

  it('sends no priority when the rule has none', async () => {
    await mountCreateJob([createPayload()]).run()

    expect(post.mock.calls[0][1]).not.toHaveProperty('priority')
  })
})

describe('validate', () => {
  const priorityError = t('job:arg:priority-invalid', {
    min: MIN_TRAFFIC_RULE_PRIORITY,
    max: MAX_TRAFFIC_RULE_PRIORITY,
  })

  itCanRun([
    { name: 'can run without a priority', mountJob: () => mountCreateJob([createPayload()]) },
    {
      name: 'can run with the lowest and the highest allowed priorities',
      mountJob: () =>
        mountCreateJob([
          createPayload({ priority: MIN_TRAFFIC_RULE_PRIORITY }),
          createPayload({ priority: MAX_TRAFFIC_RULE_PRIORITY }),
        ]),
    },
  ])

  itCannotRun(
    [MIN_TRAFFIC_RULE_PRIORITY - 1, MAX_TRAFFIC_RULE_PRIORITY + 1, 10.5].map(priority => ({
      name: `cannot run with the priority ${priority}`,
      mountJob: () => mountCreateJob([createPayload({ priority })]),
      errorMessage: priorityError,
    }))
  )
})
