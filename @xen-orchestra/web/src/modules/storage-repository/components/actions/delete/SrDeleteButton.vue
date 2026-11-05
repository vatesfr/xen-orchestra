<template>
  <MenuItem icon="action:delete" accent="danger" :disabled="!canDeleteSrs" :busy="isDeletingSrs" @click="deleteSrs()">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useSrDelete } from '@/modules/storage-repository/composables/use-sr-delete.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const { deleteSrs, canDeleteSrs, isDeletingSrs } = useSrDelete(() => [sr])
</script>
