<template>
  <MenuItem accent="brand" icon="action:delete" :disabled="!canDeleteVifs" :busy="isDeletingVifs" @click="deleteVifs()">
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVifDelete } from '@/modules/vif/composables/use-vif-delete.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif: FrontXoVif
}>()

const { t } = useI18n()

const { deleteVifs, canDeleteVifs, isDeletingVifs } = useVifDelete(() => [vif])

const hint = computed(() => (!canDeleteVifs.value ? t('vif-connected') : undefined))
</script>
