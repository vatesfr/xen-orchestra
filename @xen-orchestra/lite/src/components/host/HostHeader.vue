<template>
  <UiHeadBar>
    <template #icon>
      <VtsObjectIcon
        size="medium"
        type="host"
        :state="hostState"
        :busy="isChangingState"
        :busy-tooltip="currentOperation"
      />
    </template>
    {{ host.name_label }}
    <template v-if="isMaster" #status>
      <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
    </template>
    <template #actions>
      <VtsChangeStateMenu v-if="!uiStore.isSmall">
        <HostPowerStateActions :host />
      </VtsChangeStateMenu>
      <VtsActionsMenu :label="t('more-actions')" size="medium">
        <HostMoreActions :host :show-change-state="uiStore.isSmall" />
      </VtsActionsMenu>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import { useHostUtils } from '@/modules/host/composables/host-utils.composable.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { isMasterHost } = usePoolStore().subscribe()
const isMaster = computed(() => isMasterHost(host.$ref))

const { hostState, isChangingState, currentOperation } = useHostUtils(() => host)
</script>
