<template>
  <div class="buttons-container">
    <UiButton size="medium" accent="brand" variant="secondary" @click="router.push(cancelTo)">
      {{ t('cancel') }}
    </UiButton>
    <UiButton type="submit" size="medium" accent="brand" variant="primary">
      {{ t('action:create-vif') }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

defineProps<{
  cancelTo: RouteLocationRaw
}>()

const { t } = useI18n()

const router = useRouter()
</script>

<style lang="postcss" scoped>
.buttons-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 2.4rem;
  margin-block-start: 2.4rem;
}
</style>
