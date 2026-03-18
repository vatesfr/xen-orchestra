import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import type { XoHost, XoPool, XoVm } from '@vates/types'
import { computed, ref } from 'vue'

export type LoadBalancerPlan = 'Performance mode' | 'Density mode' | 'Simple mode'

export const LOAD_BALANCER_PLANS: LoadBalancerPlan[] = ['Performance mode', 'Density mode', 'Simple mode']

export function useLoadBalancer(poolId: XoPool['id']) {
  const { vmsByHost, vmsByPool } = useXoVmCollection()
  const { hostsByPool } = useXoHostCollection()

  const selectedPlan = ref<LoadBalancerPlan>('Performance mode')
  const simulationResult = ref<Record<XoVm['id'], XoHost['id']> | undefined>()
  const simulationError = ref<unknown>()
  const applyError = ref<unknown>()
  const isSimulating = ref(false)
  const isApplying = ref(false)

  const hosts = computed(() => hostsByPool.value.get(poolId) ?? [])

  const vms = computed(() => vmsByPool.value.get(poolId) ?? [])

  const vmsByHostForPool = computed(() => {
    const result = new Map<XoHost['id'], FrontXoVm[]>()

    for (const host of hosts.value) {
      result.set(host.id, vmsByHost.value.get(host.id) ?? [])
    }

    return result
  })

  async function simulate() {
    isSimulating.value = true
    simulationResult.value = undefined
    simulationError.value = undefined

    try {
      simulationResult.value = await fetchPost<Record<XoVm['id'], XoHost['id']>>(`pools/${poolId}/load-balance`, {
        plan: selectedPlan.value,
        dryRun: true,
      })
    } catch (error) {
      simulationError.value = error
    } finally {
      isSimulating.value = false
    }
  }

  async function apply() {
    isApplying.value = true
    applyError.value = undefined

    try {
      await fetchPost(`pools/${poolId}/load-balance`, { plan: selectedPlan.value })
      simulationResult.value = undefined
    } catch (error) {
      applyError.value = error
    } finally {
      isApplying.value = false
    }
  }

  return {
    hosts,
    vms,
    vmsByHostForPool,
    selectedPlan,
    simulationResult,
    simulationError,
    applyError,
    isSimulating,
    isApplying,
    simulate,
    apply,
  }
}
