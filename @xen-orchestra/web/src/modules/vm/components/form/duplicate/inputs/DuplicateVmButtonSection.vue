<template>
  <div class="footer">
    <UiButton variant="secondary" accent="brand" size="medium" @click="router.back()">
      {{ t('cancel') }}
    </UiButton>
    <UiButton variant="primary" accent="brand" size="medium" type="submit" :disabled="!canDuplicate" :busy="isRunning">
      {{ t('action:duplicate') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineProps<{
  canDuplicate: boolean
  isRunning: boolean
}>()

const { t } = useI18n()

const router = useRouter()
</script>

<style scoped lang="postcss">
.footer {
  display: flex;
  justify-content: center;
  gap: 1.6rem;
}
</style>
