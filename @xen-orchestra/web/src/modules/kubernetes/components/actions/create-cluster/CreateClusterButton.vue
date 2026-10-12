<template>
  <UiButton
    size="medium"
    variant="secondary"
    accent="brand"
    left-icon="action:add"
    :busy="isCreatingCluster"
    @click="openCreateClusterDrawer()"
  >
    {{ label }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useCreateKubernetesClusterDrawer } from '@/modules/kubernetes/composables/use-create-kubernetes-cluster-drawer.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { fullLabel = true } = defineProps<{
  fullLabel?: boolean
}>()

const { t } = useI18n()

const label = computed(() => {
  if (fullLabel) {
    return t('new-cluster')
  }
  return t('new')
})

const { openDrawer: openCreateClusterDrawer, isRunning: isCreatingCluster } = useCreateKubernetesClusterDrawer()
</script>
