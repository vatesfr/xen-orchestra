<template>
  <VtsErrorModal :title="t('unable-to-delete-network')">
    <template #content>
      {{ error ?? t('error') }}
      <template v-if="showConnectedVifsMessage">
        <br />
        <I18nT keypath="disconnect-vifs-in-xo-5-to-delete-network" scope="global">
          <template #xo-5>
            <UiLink :href="xo5Link" size="medium">
              {{ t('xo-5') }}
            </UiLink>
          </template>
        </I18nT>
      </template>
    </template>
  </VtsErrorModal>
</template>

<script lang="ts" setup>
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsErrorModal from '@core/components/modal/VtsErrorModal.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { showConnectedVifsMessage } = defineProps<{
  error?: string
  showConnectedVifsMessage?: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const xo5Link = computed(() => {
  return buildXo5Route(`/home?p=1&s=power_state%3Arunning+&t=VM`)
})
</script>
