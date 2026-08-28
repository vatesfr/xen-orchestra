<template>
  <UiHeadBar>
    <template #icon>
      <VtsObjectIcon
        size="medium"
        type="host"
        :state="powerState"
        :busy="isChangingState"
        :busy-tooltip="currentOperation"
      />
    </template>
    {{ host.name_label }}
    <template v-if="isMaster" #status>
      <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
    </template>
    <template #actions>
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('action:change-state') }}</UiDropdownButton>
        </template>
        <HostPowerStateActions :host />
      </MenuList>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import { useHostUtils } from '@/modules/host/composables/host-utils.composable.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { isHostRunning } = useHostMetricsStore().subscribe()

const powerState = computed(() => (isHostRunning(host) ? 'running' : 'halted'))

const { isMasterHost } = usePoolStore().subscribe()
const isMaster = computed(() => isMasterHost(host.$ref))

const { isChangingState, currentOperation } = useHostUtils(() => host)
</script>
