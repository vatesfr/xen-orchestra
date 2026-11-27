<template>
  <VtsBanner v-if="upgrade !== undefined" accent="info">
    <UiInfo accent="info">{{ t('appliance:xo-being-updated') }}</UiInfo>
  </VtsBanner>
</template>

<script lang="ts" setup>
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { upgrade } = useXoaUpgrade()
</script>
