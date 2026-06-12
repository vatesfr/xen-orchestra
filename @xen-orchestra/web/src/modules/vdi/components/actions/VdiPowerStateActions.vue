<template>
  <VbdConnectButton v-if="vm && vbd && !attachedVbd" :vm :vbd is-vdi-page />
  <VbdDisconnectButton v-if="vm && vbd && attachedVbd" :vm :vbd is-vdi-page />

  <UiButton
    v-if="!vm || !vbd"
    v-tooltip="t('vdi-not-attached-to-vm')"
    variant="tertiary"
    accent="brand"
    size="medium"
    disabled
    left-icon="action:connect"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.js'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.js'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vm?: FrontXoVm
  vbd?: FrontXoVbd
}>()

const { t } = useI18n()

const attachedVbd = computed(() => {
  return vbd && vbd.attached
})
</script>
