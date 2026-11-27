<template>
  <UiButton :busy="isAddingProxy" accent="brand" size="small" variant="tertiary" @click="openNewProxyDrawer()">
    {{ t('action:set-proxy') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useNewProxy } from '@/modules/appliance/composables/use-new-proxy.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openNewProxyDrawer, isAddingProxy } = useNewProxy()
</script>
