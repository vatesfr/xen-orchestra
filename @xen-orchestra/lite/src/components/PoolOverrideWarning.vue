<template>
  <div
    v-if="xenApi.isPoolOverridden"
    v-tooltip="
      asTooltip && {
        placement: 'right',
        content: `
      ${t('you-are-currently-on', [masterSessionStorage])}.
      ${t('click-to-return-default-pool')}
      `,
      }
    "
    class="warning-not-current-pool"
    @click="xenApi.resetPoolMasterIp"
  >
    <UiInfo accent="warning">
      <p v-if="!asTooltip">
        <I18nT keypath="you-are-currently-on">
          <strong>{{ masterSessionStorage }}</strong>
        </I18nT>
        <br />
        {{ t('click-to-return-default-pool') }}
      </p>
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { useXenApiStore } from '@/stores/xen-api.store'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useSessionStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

defineProps<{
  asTooltip?: boolean
}>()

const { t } = useI18n()

const xenApi = useXenApiStore()
const masterSessionStorage = useSessionStorage('master', null)
</script>

<style lang="postcss" scoped>
.warning-not-current-pool {
  color: var(--color-warning-txt-base);
  cursor: pointer;
}
</style>
