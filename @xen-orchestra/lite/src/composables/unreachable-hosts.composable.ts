import { useModal } from '@/composables/modal.composable'
import { ipToHostname } from '@/libs/utils'
import { useHostStore } from '@/stores/xen-api/host.store'
import { whenever } from '@vueuse/core'
import { difference } from 'lodash-es'
import { computed, ref, watch } from 'vue'

export const useUnreachableHosts = () => {
  const { records: hosts } = useHostStore().subscribe()
  const unreachableHostsUrls = ref<Set<string>>(new Set())

  watch(hosts, (nextHosts, previousHosts) => {
    difference(nextHosts, previousHosts).forEach(host => {
      const url = new URL('http://localhost')
      url.protocol = window.location.protocol
      url.hostname = ipToHostname(host.address)
      fetch(url, { mode: 'no-cors' }).catch(() => unreachableHostsUrls.value.add(url.toString()))
    })
  })

  whenever(
    () => unreachableHostsUrls.value.size > 0,
    () => {
      const { onApprove, onDecline } = useModal(() => import('@/components/modals/UnreachableHostsModal.vue'), {
        urls: computed(() => Array.from(unreachableHostsUrls.value.values())),
      })

      onApprove(() => window.location.reload())
      onDecline(() => unreachableHostsUrls.value.clear())
    },
    { immediate: true }
  )
}
