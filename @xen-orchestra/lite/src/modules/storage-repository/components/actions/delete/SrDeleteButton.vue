<template>
  <VtsDeleteButton :hint="deleteSrsErrorMessage" :disabled="!canDeleteSrs" :busy="isDeletingSrs" @click="deleteSrs()" />
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrDelete } from '@/modules/storage-repository/composables/use-sr-delete.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'

const { sr } = defineProps<{
  sr: XenApiSr
}>()

const { deleteSrs, canDeleteSrs, isDeletingSrs, deleteSrsErrorMessage } = useSrDelete(() => [sr])
</script>
