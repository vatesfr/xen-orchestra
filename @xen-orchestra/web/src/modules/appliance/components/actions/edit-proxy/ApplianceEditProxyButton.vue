<template>
  <UiButton
    :busy="isEditingProxy || isRemovingProxy"
    accent="brand"
    left-icon="action:edit"
    size="small"
    variant="tertiary"
    @click="openEditProxyDrawer()"
  >
    {{ t('action:edit-proxy') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useEditProxy } from '@/modules/appliance/composables/use-edit-proxy.composable.ts'
import type { XoaProxy } from '@/modules/appliance/types/xoa-proxy.type.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { proxy } = defineProps<{
  proxy: XoaProxy
}>()

const { t } = useI18n()

const { openEditProxyDrawer, isEditingProxy, isRemovingProxy } = useEditProxy(() => proxy)
</script>
