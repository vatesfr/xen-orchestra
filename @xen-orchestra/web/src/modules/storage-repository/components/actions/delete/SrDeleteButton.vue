<template>
  <VtsDeleteButton :disabled="!canDeleteSrs" :busy="isDeletingSrs" @click="deleteSrs()" />
</template>

<script lang="ts" setup>
import { useSrDelete } from '@/modules/storage-repository/composables/use-sr-delete.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { deleteSrs, canDeleteSrs, isDeletingSrs } = useSrDelete(() => [sr])
</script>
