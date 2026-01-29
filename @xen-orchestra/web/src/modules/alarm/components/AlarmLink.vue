<template>
  <div class="alarm-link">
    <UiLink size="small" :to="route" :icon>
      {{ nameLabel }}
    </UiLink>
  </div>
</template>

<script setup lang="ts" generic="TRecord extends XapiXoRecord">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import type { IconName } from '@core/icons'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XapiXoRecord, XoHost, XoSr, XoVm, XoVmController } from '@vates/types'
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

const icon = computed<IconName | undefined>(() => {
  switch (type) {
    case 'VM':
    case 'VM-controller':
      return 'object:vm'
    case 'host':
      return 'object:host'
    case 'SR':
      return 'object:sr'
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
