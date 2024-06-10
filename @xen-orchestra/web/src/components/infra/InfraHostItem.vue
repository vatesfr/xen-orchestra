<template>
  <TreeItem>
    <TreeItemLabel :icon="faServer" :no-indent="!hasVMs" :route="`/host/${host.id}`">
      {{ host.name_label }}
      <template #addons>
        <UiIcon
          v-if="isMaster"
          v-tooltip="$t('core.master')"
          :icon="faStar"
          color="warning"
        />
      </template>
    </TreeItemLabel>
    <template v-if="hasVMs" #sublist>
      <InfraVmList :container-id="host.id" for="host" />
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraVmList from '@/components/infra/InfraVmList.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { Host } from '@/types/host.type'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  host: Host
}>()

const { isMasterHost } = useHostStore().subscribe()
const { vmsByHost } = useVmStore().subscribe()

const isMaster = computed(() => isMasterHost(props.host.id))

const vms = computed(() => vmsByHost.value.get(props.host.id) ?? [])

const hasVMs = computed(() => vms.value.length > 0)
</script>
