<template>
  <VtsMobileMenu v-if="uiStore.isSmall" :title="t('actions')">
    <template #trigger="{ isOpen, open }">
      <UiButtonIcon
        accent="brand"
        size="small"
        :disabled="selectedRefs.length === 0"
        :selected="isOpen"
        icon="fa:ellipsis"
        @click="open()"
      />
    </template>
    <VmsBulkActionItems :selected-refs />
  </VtsMobileMenu>
  <MenuList
    v-else
    :disabled="selectedRefs.length === 0"
    class="vms-actions-bar"
    horizontal
    no-border
    placement="bottom-end"
  >
    <VmsBulkActionItems :selected-refs />
  </MenuList>
</template>

<script lang="ts" setup>
import VmsBulkActionItems from '@/components/vm/VmsBulkActionItems.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsMobileMenu from '@core/components/menu/VtsMobileMenu.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  selectedRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
}
</style>
