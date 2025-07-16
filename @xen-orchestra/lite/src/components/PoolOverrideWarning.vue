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
    <div class="wrapper">
      <VtsIcon name="fa:triangle-exclamation" size="medium" />
      <p v-if="!asTooltip">
        <I18nT keypath="you-are-currently-on">
          <strong>{{ masterSessionStorage }}</strong>
        </I18nT>
        <br />
        {{ t('click-to-return-default-pool') }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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

  .wrapper {
    display: flex;
    justify-content: center;

    svg {
      margin: auto 1rem;
    }
  }
}
</style>
