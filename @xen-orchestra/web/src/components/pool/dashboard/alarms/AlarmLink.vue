<template>
  <div class="alarm-link">
    <UiLink size="small" :to="route" :icon>
      {{ nameLabel }}
    </UiLink>
  </div>
</template>

<script setup lang="ts" generic="TRecord extends XapiXoRecord">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/remote-resources/use-xo-vm-controller-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { XoVmController } from '@/types/xo/vm-controller.type.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faDatabase, faDesktop, faServer } from '@fortawesome/free-solid-svg-icons'
import type { XapiXoRecord } from '@vates/types'
import { computed } from 'vue'

const { type, uuid } = defineProps<{
  type: TRecord['type'] | 'unknown'
  uuid: TRecord['uuid']
}>()

const { getHostById } = useXoHostCollection()
const { getVmById } = useXoVmCollection()
const { getVmControllerById } = useXoVmControllerCollection()
const { getSrById } = useXoSrCollection()

const record = computed(() => {
  switch (type) {
    case 'VM':
      return getVmById(uuid as XoVm['id'])
    case 'host':
      return getHostById(uuid as XoHost['id'])
    case 'VM-controller':
      return getVmControllerById(uuid as XoVmController['id'])
    case 'SR':
      return getSrById(uuid as XoSr['id'])
    default:
      return undefined
  }
})

const nameLabel = computed(() => record.value?.name_label ?? uuid)

const icon = computed(() => {
  switch (type) {
    case 'VM':
    case 'VM-controller':
      return faDesktop
    case 'host':
      return faServer
    case 'SR':
      return faDatabase
    default:
      return undefined
  }
})

const route = computed(() => {
  if (!record.value) {
    return undefined
  }

  if (type === 'VM-controller') {
    return `/host/${(record.value as XoVmController).$container}`
  }

  return `/${type}/${uuid}`
})
</script>

<style lang="postcss" scoped>
.alarm-link {
  align-items: center;
  line-height: 1;
}
</style>
