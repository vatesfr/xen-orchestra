<template>
  <VtsDeleteButton :hint="t('vif-connected')" :disabled="!canDeleteVifs" :busy="isDeletingVifs" @click="deleteVifs()" />
</template>

<script lang="ts" setup>
import { useVifDelete } from '@/modules/vif/composables/use-vif-delete.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif: FrontXoVif
}>()

const { t } = useI18n()

const { deleteVifs, canDeleteVifs, isDeletingVifs } = useVifDelete(() => [vif])
</script>
