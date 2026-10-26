import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import { recentDrops } from '@/modules/vdf/utils/vdf-recent-drops.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useNow } from '@vueuse/core'
import { computed, type MaybeRefOrGetter } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export const VDF_RECENT_DROPS_WINDOW_MINUTES = 15

// What a pool's rule log dropped lately, by flow, each with a trace of the
// same packet ("why is it dropped?"). Only rules and policies that log what
// they drop show up here.
export function useVdfRecentDrops(rawPoolId: MaybeRefOrGetter<string>, { limit }: { limit: number }) {
  const poolId = toComputed(rawPoolId)

  const { ruleLog, isRuleLogReady, hasRuleLogError } = useVdfRuleLog({}, poolId)

  const { vms } = useXoVmCollection()

  const now = useNow({ interval: 5000 })

  const poolVms = computed(() => vms.value.filter(vm => vm.$pool === poolId.value))

  const { vmAddresses } = useVdfInterfaces()

  // a running VM first: a halted one keeps the addresses it last had; an
  // address the guest reports for a device with no interface names nothing
  function vmOfIp(ip: string) {
    const candidates = poolVms.value.filter(vm => vmAddresses(vm).includes(ip))

    return candidates.find(vm => vm.power_state === 'Running') ?? candidates[0]
  }

  const drops = computed(() =>
    recentDrops(ruleLog.value?.entries ?? [], {
      since: now.value.getTime() - VDF_RECENT_DROPS_WINDOW_MINUTES * 60_000,
      limit,
    }).map(drop => {
      const named = poolVms.value.find(vm => vm.name_label === drop.vm)
      // egress (vdf#53): the named VM is the source, the destination by address
      const source = drop.egress ? named : vmOfIp(drop.src)
      const destination = drop.egress ? vmOfIp(drop.dst) : named
      const canTrace =
        (drop.egress ? source !== undefined : destination !== undefined) && ['tcp', 'udp', 'icmp'].includes(drop.proto)

      // same query as the rule log's and Live's links to the trace
      const traceRoute: RouteLocationRaw | undefined = canTrace
        ? {
            name: '/pool/[id]/firewall/trace',
            params: { id: poolId.value },
            query: {
              from: source?.id ?? 'external',
              fromip: source === undefined ? drop.src : undefined,
              to: destination?.id ?? 'external',
              toip: destination === undefined ? drop.dst : undefined,
              proto: drop.proto,
              port: drop.port,
              run: '1',
            },
          }
        : undefined

      return { ...drop, source, destination, traceRoute }
    })
  )

  return { drops, isRuleLogReady, hasRuleLogError }
}
