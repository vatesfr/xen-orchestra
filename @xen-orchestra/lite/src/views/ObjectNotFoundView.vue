<template>
  <div>
    <img alt="" src="../assets/object-not-found.svg" />
    <p class="text">{{ $t('object-not-found', { id }) }}</p>
    <UiButton @click="router.push({ name: 'home' })">{{ $t('back-pool-dashboard') }}</UiButton>
  </div>
</template>

<script setup lang="ts">
import { usePageTitleStore } from '@/stores/page-title.store'
import UiButton from '@core/components/button/UiButton.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineProps<{
  id: string
}>()

usePageTitleStore().setTitle(useI18n().t('not-found'))

const router = useRouter()
</script>

<style lang="postcss" scoped>
div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

img {
  width: 30%;
}

.text {
  color: var(--color-normal-txt-base);
  font-size: 36px;
  font-weight: 400;
  line-height: 150%;
  margin: 0.5em;
  text-align: center;
}
</style>
