import { useXoPifManagementReconfigureJob } from '@/modules/pif/jobs/xo-pif-management-reconfigure.job.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itCanRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { answerPostsWithTask, mockXoTaskUtils, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { HOST_POWER_STATE, IP_CONFIGURATION_MODE, IPV6_CONFIGURATION_MODE, PRIMARY_ADDRESS_TYPE } from '@vates/types'

const post = mockedExport(fetchPost)

const { monitorTask } = taskUtilsMock

// The task collection would open an SSE subscription
mockXoTaskUtils()

mockXoCollections('host', 'network')

const PIF = createPif()

const PIF_WITHOUT_IP = createPif({ mode: IP_CONFIGURATION_MODE.NONE })

const MANAGEMENT_MTU = 1500

const JUMBO_FRAMES_MTU = 9000

const INVALID_MTU_MESSAGE = t('job:pif-management-reconfigure:invalid-mtu', { mtu: MANAGEMENT_MTU })

beforeEach(() => {
  taskUtilsMock.reset()
  xoCollectionsMock.reset()
  xoCollectionsMock.hosts.value = [createHost({ id: PIF.$host })]
  setNetworkMtu(MANAGEMENT_MTU)

  answerPostsWithTask(post)
})

function mountManagementReconfigureJob(pif: FrontXoPif) {
  return mountComposable(() => useXoPifManagementReconfigureJob(() => pif)).wrapper.vm
}

function setNetworkMtu(mtu: number) {
  xoCollectionsMock.networks.value = [createNetwork({ id: PIF.$network, MTU: mtu })]
}

describe('validate', () => {
  itCanRun([
    {
      name: 'can run for a PIF with an IP on a network with a 1500 MTU',
      mountJob: () => mountManagementReconfigureJob(PIF),
    },
    {
      name: 'can run for an IPv6 PIF with an IPv6 configuration',
      mountJob: () =>
        mountManagementReconfigureJob(
          createPif({
            primaryAddressType: PRIMARY_ADDRESS_TYPE.IPV6,
            mode: IP_CONFIGURATION_MODE.NONE,
            ipv6Mode: IPV6_CONFIGURATION_MODE.STATIC,
          })
        ),
    },
  ])

  itCannotRun([
    {
      name: 'cannot run when the host of the PIF is halted',
      mountJob: () => {
        xoCollectionsMock.hosts.value = [createHost({ id: PIF.$host, power_state: HOST_POWER_STATE.HALTED })]

        return mountManagementReconfigureJob(PIF)
      },
      errorMessage: t('job:pif-management-reconfigure:bad-power-state'),
    },
    {
      name: 'cannot run when the host of the PIF is not in the collection',
      mountJob: () => {
        xoCollectionsMock.hosts.value = []

        return mountManagementReconfigureJob(PIF)
      },
      errorMessage: t('job:pif-management-reconfigure:bad-power-state'),
    },
    {
      name: 'cannot run for the current management PIF',
      mountJob: () => mountManagementReconfigureJob(createPif({ management: true })),
      errorMessage: t('job:pif-management-reconfigure:current-pif'),
    },
    {
      name: 'cannot run when the network of the PIF has an MTU other than 1500',
      mountJob: () => {
        setNetworkMtu(JUMBO_FRAMES_MTU)

        return mountManagementReconfigureJob(PIF)
      },
      errorMessage: INVALID_MTU_MESSAGE,
    },
    {
      name: 'cannot run when the network of the PIF is not in the collection',
      mountJob: () => {
        xoCollectionsMock.networks.value = []

        return mountManagementReconfigureJob(PIF)
      },
      errorMessage: INVALID_MTU_MESSAGE,
    },
    {
      name: 'reports the MTU of the network before the missing IP of the PIF',
      mountJob: () => {
        setNetworkMtu(JUMBO_FRAMES_MTU)

        return mountManagementReconfigureJob(PIF_WITHOUT_IP)
      },
      errorMessage: INVALID_MTU_MESSAGE,
    },
    {
      name: 'cannot run for an IPv4 PIF without IP configuration',
      mountJob: () => mountManagementReconfigureJob(PIF_WITHOUT_IP),
      errorMessage: t('job:pif-management-reconfigure:missing-ip'),
    },
    {
      name: 'cannot run for an IPv6 PIF without IPv6 configuration',
      mountJob: () =>
        mountManagementReconfigureJob(
          createPif({ primaryAddressType: PRIMARY_ADDRESS_TYPE.IPV6, ipv6Mode: IPV6_CONFIGURATION_MODE.NONE })
        ),
      errorMessage: t('job:pif-management-reconfigure:missing-ip'),
    },
  ])

  it('cannot run while the management interface is being reconfigured', () => {
    monitorTask.mockReturnValue(new Promise(() => {}))

    expectJobRunning(mountManagementReconfigureJob(PIF), t('job:pif-management-reconfigure:in-progress'))
  })
})

describe('run', () => {
  it('posts the PIF to the management reconfigure action of its host and waits for the task', async () => {
    await mountManagementReconfigureJob(PIF).run()

    const url = `hosts/${PIF.$host}/actions/management_reconfigure`

    expect(post).toHaveBeenCalledWith(url, { pif: PIF.id })
    expect(monitorTask).toHaveBeenCalledWith(`task-of-${url}`)
  })

  itRejectsWithRequestError('rejects when the task fails', {
    request: monitorTask,
    errorMessage: 'PIF_HAS_NO_NETWORK_CONFIGURATION()',
    run: () => mountManagementReconfigureJob(PIF).run(),
  })
})
