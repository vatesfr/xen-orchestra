<template>
  <UiButton
    :disabled="!canUpgradeCluster"
    :busy="isUpgradingCluster"
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="fa:arrow-up"
    @click="upgradeCluster()"
  >
    {{ t('action:upgrade') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useKubernetesClusterUpgrade } from '@/modules/kubernetes/composables/use-kubernetes-cluster-upgrade.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { upgradeCluster, canUpgradeCluster, isUpgradingCluster } = useKubernetesClusterUpgrade(() => cluster)
</script>
