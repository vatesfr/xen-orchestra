<template>
  <div class="alarm-link">
    <UiLink size="small" :to="route" :icon>
      {{ nameLabel }}
    </UiLink>
  </div>
</template>

<script setup lang="ts" generic="TRecord extends XapiXoRecord">
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import {
  useXoVmControllerCollection,
  type FrontXoVmController,
} from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import type { IconName } from '@core/icons'
import UiLink from '@core/components/ui/link/UiLink.vue'
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
      return getVmById(uuid as FrontXoVm['id'])
    case 'host':
      return getHostById(uuid as FrontXoHost['id'])
    case 'VM-controller':
      return getVmControllerById(uuid as FrontXoVmController['id'])
    case 'SR':
      return getSrById(uuid as FrontXoSr['id'])
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
    return `/host/${(record.value as FrontXoVmController).$container}`
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
