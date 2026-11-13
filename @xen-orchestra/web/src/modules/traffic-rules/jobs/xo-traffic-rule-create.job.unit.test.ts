import {
  type TrafficRulePayload,
  useXoTrafficRuleCreateJob,
} from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import {
  MAX_TRAFFIC_RULE_PRIORITY,
  MIN_TRAFFIC_RULE_PRIORITY,
} from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoNetwork } from '@vates/types'

const { post, monitorTask } = vi.hoisted(() => ({
  post: vi.fn(),
  monitorTask: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: post as unknown as typeof fetchPost,
}))

// The task collection would open an SSE subscription
vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask })) as unknown as typeof useXoTaskUtils,
}))

beforeEach(() => {
  post.mockReset()
  monitorTask.mockReset()

  post.mockResolvedValue({ taskId: 'task-1' })
  monitorTask.mockResolvedValue(undefined)
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

  it('can run without a priority', () => {
    expect(mountCreateJob([createPayload()]).canRun).toBe(true)
  })

  it('can run with the lowest and the highest allowed priorities', () => {
    const payloads = [
      createPayload({ priority: MIN_TRAFFIC_RULE_PRIORITY }),
      createPayload({ priority: MAX_TRAFFIC_RULE_PRIORITY }),
    ]

    expect(mountCreateJob(payloads).canRun).toBe(true)
  })

  it.each([MIN_TRAFFIC_RULE_PRIORITY - 1, MAX_TRAFFIC_RULE_PRIORITY + 1, 10.5])(
    'cannot run with the priority %s',
    priority => {
      const job = mountCreateJob([createPayload({ priority })])

      expect(job.canRun).toBe(false)
      expect(job.errorMessage).toBe(priorityError)
    }
  )
})
