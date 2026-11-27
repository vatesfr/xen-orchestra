<template>
  <MenuItem
    v-tooltip="hint"
    :busy="isRestartingXoServer"
    :disabled="upgrade !== undefined"
    accent="warning"
    icon="action:reboot"
    @click="openRestartXoServerModal()"
  >
    {{ t('action:restart-xo-server') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import { useXoaRestartXoServerJob } from '@/modules/appliance/jobs/xoa-restart-xo-server.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { run: restartXoServer, isRunning: isRestartingXoServer } = useXoaRestartXoServerJob()

// l'upgrade redémarre déjà xo-server
const { upgrade } = useXoaUpgrade()

const hint = computed(() => {
  if (upgrade.value === undefined) {
    return false
  }

  return t('job:xoa-upgrade:in-progress')
})

const { open: openRestartXoServerModal } = useOverlay({
  component: () => import('@/modules/appliance/components/modal/RestartXoServerModal.vue'),
  events: {
    onConfirm: () => restartXoServer({ detached: true }),
    onCancel: true,
  },
})
</script>
