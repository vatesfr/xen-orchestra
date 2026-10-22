<template>
  <div v-if="paused" class="kubernetes-paused-status">
    <VtsIcon class="icon" name="status:paused-circle" size="medium" />
    <p class="typo-body-regular">{{ t('yes') }}</p>
  </div>
  <KubernetesStatus v-else status="no" />
</template>

<script setup lang="ts">
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useI18n } from 'vue-i18n'

// TODO: use KubernetesStatus UiInfo with the "paused" accent once it is available in web-core
defineProps<{
  paused: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.kubernetes-paused-status {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;

  .icon {
    transform: translateY(0.2ex);
  }
}
</style>
