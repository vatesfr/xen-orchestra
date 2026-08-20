<template>
  <UiModal icon="status:info-picto" accent="info" class="unreachable-pool-modal" @dismiss="emit('close')">
    <template #title>{{ t('unreachable-pools') }}</template>

    <template #content>
      <div class="text">
        <p class="typo-body-regular">{{ t('unreachable-pools-content') }}</p>
        <p class="typo-body-bold">{{ t('unreachable-pools-tip') }}</p>
      </div>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.unreachable-pool-modal {
  .text {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
}
</style>
