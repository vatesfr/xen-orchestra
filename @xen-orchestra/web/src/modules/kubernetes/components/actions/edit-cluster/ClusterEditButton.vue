<template>
  <MenuItem
    icon="action:edit"
    accent="neutral"
    :disabled="!canEditCluster"
    :busy="isEditingCluster"
    @click="editCluster()"
  >
    {{ t('action:edit') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesClusterEdit } from '@/modules/kubernetes/composables/use-kubernetes-cluster-edit.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { editCluster, canEditCluster, isEditingCluster } = useKubernetesClusterEdit(() => cluster)
</script>
