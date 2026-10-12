<template>
  <MenuItem
    icon="action:download"
    accent="neutral"
    :disabled="!canDownloadKubeconfig"
    :busy="isDownloadingKubeconfig"
    @click="downloadKubeconfig()"
  >
    {{ t('action:download-kubeconfig-admin-file') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesClusterKubeconfigDownload } from '@/modules/kubernetes/composables/use-kubernetes-cluster-kubeconfig-download.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { downloadKubeconfig, canDownloadKubeconfig, isDownloadingKubeconfig } = useKubernetesClusterKubeconfigDownload(
  () => cluster
)
</script>
