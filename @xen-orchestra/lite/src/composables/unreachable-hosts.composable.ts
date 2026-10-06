import { ipToHostname } from '@/libs/utils.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed, whenever } from '@vueuse/core'
import { difference } from 'lodash-es'
import { ref, watch } from 'vue'

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

  const { open } = useOverlay({
    component: () => import('@/components/modals/UnreachableHostsModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  const modalProps = reactiveComputed(() => ({
    urls: Array.from(unreachableHostsUrls.value.values()),
  }))

  async function openModal() {
    const { event } = await open({ props: modalProps })

    if (event === 'onConfirm') {
      window.location.reload()
    }

    unreachableHostsUrls.value.clear()
  }

  whenever(
    () => unreachableHostsUrls.value.size > 0,
    () => openModal(),
    {
      immediate: true,
    }
  )
}
