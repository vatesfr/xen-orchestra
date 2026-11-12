<template>
  <VtsActionButton variant="tertiary" accent="brand" icon="action:edit" @click="goToVifEdit(vif)">
    {{ t('action:edit') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useVifEdit } from '@/modules/vif/composables/use-vif-edit.composable.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif: XenApiVif
}>()

const { t } = useI18n()

const { goToVifEdit } = useVifEdit()
</script>
