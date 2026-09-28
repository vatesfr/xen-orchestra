<template>
  <MenuItem icon="action:add" class="typo-body-bold-small" @click="openCreateClusterDrawer()">
    {{ t('new-cluster') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useCreateKubernetesClusterDrawer } from '@/modules/kubernetes/composables/use-create-kubernetes-cluster-drawer.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openDrawer: openCreateClusterDrawer } = useCreateKubernetesClusterDrawer()
</script>
