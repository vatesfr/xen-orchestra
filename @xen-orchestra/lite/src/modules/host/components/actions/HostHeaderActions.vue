<template>
  <VtsHeadBarActions v-slot="{ isInline }" :actions="quickActions">
    <HostStartButton v-if="isInline.start" :host />
    <HostShutdownButton v-if="isInline.shutdown" :host />
    <HostRebootButton v-if="isInline.reboot" :host />
    <VtsActionsMenu :label="t('more-actions')" size="medium" no-section-title>
      <HostMoreActions :host layout="sections" :exclude="isInline" />
    </VtsActionsMenu>
  </VtsHeadBarActions>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import { useHostQuickActions } from '@/modules/host/composables/host-quick-actions.composable.ts'
import VtsHeadBarActions from '@core/components/head-bar/VtsHeadBarActions.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const quickActions = useHostQuickActions(() => host)
</script>
