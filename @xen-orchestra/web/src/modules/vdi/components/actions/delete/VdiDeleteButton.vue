<template>
  <MenuItem
    icon="action:delete"
    :disabled="!canDeleteVdi"
    :busy="isDeletingVdi"
    class="delete"
    @click="openVdiDeleteModal()"
  >
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiDeleteModal } from '@/modules/vdi/composables/use-vdi-delete-modal.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.js'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { openModal: openVdiDeleteModal, canRun: canDeleteVdi, isRunning: isDeletingVdi } = useVdiDeleteModal(() => [vdi])

const hint = computed(() => (!canDeleteVdi.value ? t('running-vm') : undefined))
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
