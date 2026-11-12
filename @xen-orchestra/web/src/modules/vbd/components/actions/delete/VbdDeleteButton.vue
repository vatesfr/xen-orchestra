<template>
  <VtsActionButton
    :hint="deleteVbdsErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:detach"
    :disabled="!canDeleteVbds"
    :busy="isDeletingVbds"
    @click="deleteVbds()"
  >
    {{ t('action:detach-vdi') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useVbdDelete } from '@/modules/vbd/composables/use-vbd-delete.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { deleteVbds, canDeleteVbds, isDeletingVbds, deleteVbdsErrorMessage } = useVbdDelete({
  vbds: () => [vbd],
  vm: () => vm,
})
</script>
