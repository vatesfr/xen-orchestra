<template>
  <MenuItem
    icon="action:delete"
    class="delete"
    :disabled="!canDeleteClusters"
    :busy="isDeletingClusters"
    @click="deleteClusters()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesClusterDelete } from '@/modules/kubernetes/composables/use-kubernetes-cluster-delete.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { deleteClusters, canDeleteClusters, isDeletingClusters } = useKubernetesClusterDelete(() => [cluster])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
