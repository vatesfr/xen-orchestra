<template>
  <VtsModal icon="fa:user-astronaut" dismissible accent="info" class="unreachable-pool" :dismissible-key>
    <template #title>
      {{ t('pool-unreachable') }}
    </template>

    <template #content>
      <div class="content">
        <div class="typo-body-regular">{{ t('pool-unreachable-helper') }}</div>
        <div class="typo-body-bold">{{ t('pool-unreachable-tip') }}</div>
      </div>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import type { UseMagicKeysReturn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { dismissibleKey } = defineProps<{
  dismissibleKey?: Array<UseMagicKeysReturn<false>>
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.unreachable-pool {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  div {
    text-align: left;
  }
}
</style>
