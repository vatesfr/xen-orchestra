<template>
  <VtsHeadBarActions v-slot="{ isInline }" :actions="quickActions">
    <PoolNewVmButton v-if="isInline['new-vm']" :pool-id="host.$pool" />
    <HostStartButton v-if="isInline.start" :host />
    <HostShutdownButton v-if="isInline.shutdown" :host />
    <HostRebootButton v-if="isInline.reboot" :host />
    <VtsActionsMenu :label="t('more-actions')" size="medium" no-section-title>
      <HostMoreActions :host layout="sections" :exclude="isInline">
        <template #leading-actions>
          <PoolNewVmButton v-if="!isInline['new-vm']" :pool-id="host.$pool" />
        </template>
      </HostMoreActions>
    </VtsActionsMenu>
  </VtsHeadBarActions>
</template>

<script lang="ts" setup>
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostQuickActions } from '@/modules/host/utils/xo-host.util.ts'
import PoolNewVmButton from '@/modules/pool/components/actions/new-vm/PoolNewVmButton.vue'
import VtsHeadBarActions from '@core/components/head-bar/VtsHeadBarActions.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const quickActions = computed(() => getHostQuickActions(host))
</script>
