import { ipToHostname } from '@/libs/utils'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
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

  const openModal = useOverlay({
    keepOpenOnRouteChange: true,
    component: import('@/components/modals/UnreachableHostsModal.vue'),
    props: { urls: computed(() => Array.from(unreachableHostsUrls.value.values())) },
    onConfirm: () => window.location.reload(),
    onCancel: () => unreachableHostsUrls.value.clear(),
  })

  whenever(() => unreachableHostsUrls.value.size > 0, openModal, {
    immediate: true,
  })
}
